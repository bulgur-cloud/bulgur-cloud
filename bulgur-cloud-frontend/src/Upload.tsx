import { Fab, Icon, View } from "native-base";
import { Platform } from "react-native";
import { runAsync, STORAGE } from "./client/base";
import { useCreateFolder, useRename, useUpload } from "./client/storage";
import { ERR_NOT_IMPLEMENTED } from "./error";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { storageSlice, useAppDispatch, useAppSelector } from "./store";
import { DashboardParams } from "./routes";
import { joinURL } from "./fetch";
import { useFilenameModal } from "./components/FilenameModal";

function selectFiles(): Promise<null | File[]> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const picker = document.createElement("input");
      picker.type = "file";
      picker.multiple = true;
      picker.accept = "*";
      picker.onchange = () => {
        // Cancelled prompt
        if (!picker.files) {
          resolve(null);
          return;
        }

        const files = Array.from(picker.files);
        resolve(files);
        return;
      };
      picker.click();
    });
  } else {
    throw ERR_NOT_IMPLEMENTED;
  }
}

export function UploadButton(props: DashboardParams) {
  const { doUpload } = useUpload();
  const params = props.route.params;

  return (
    <Fab
      placement="bottom-right"
      label="Upload"
      position="fixed"
      icon={
        <Icon
          as={FontAwesome5}
          name="cloud-upload-alt"
          height="100%"
          size={4}
        />
      }
      onPress={() => {
        runAsync(async () => {
          console.log("Bringing up file selection prompt");
          const files = await selectFiles();
          if (files === null || files.length === 0) {
            console.log("File selection prompt rejected");
            return;
          }
          console.log(`Picked ${files.length} files`);

          doUpload(joinURL(STORAGE, params.store, params.path), files);
        });
      }}
    ></Fab>
  );
}

export function CreateNewDirectory(props: DashboardParams) {
  const [openNewFolderModal, NewFolderModal] = useCreateNewFolderModal(props);

  return (
    <View>
      <Fab
        placement="bottom-right"
        right="140px"
        label="New folder"
        position="fixed"
        icon={
          <Icon as={FontAwesome5} name="folder-plus" height="100%" size={4} />
        }
        onPress={() => {
          openNewFolderModal();
        }}
      ></Fab>
      {NewFolderModal}
    </View>
  );
}

export function useCreateNewFolderModal(props: DashboardParams) {
  const { doCreateFolder } = useCreateFolder();
  const params = props.route.params;

  function runCreateFolder(name: string) {
    runAsync(async () => {
      // An empty upload will just create the folder in the path
      await doCreateFolder(joinURL(STORAGE, params.store, params.path, name));
    });
  }

  return useFilenameModal({
    title: "Create new folder",
    primary: "Create",
    placeHolder: "Enter a name for the new folder",
    actions: {
      Create: {
        message: "Create",
        action: runCreateFolder,
      },
    },
  });
}

export function MoveItems(props: DashboardParams) {
  const dispatch = useAppDispatch();
  const markedForMove = useAppSelector((state) => state.storage.markedForMove);
  const { doRename } = useRename();
  const params = props.route.params;

  if (Object.keys(markedForMove).length === 0) return <View />;

  return (
    <Fab
      placement="bottom-right"
      right="290px"
      label="Move here"
      position="fixed"
      icon={
        <Icon
          as={MaterialCommunityIcons}
          name="select-place"
          height="100%"
          size={4}
        />
      }
      onPress={() => {
        runAsync(async () => {
          await Promise.all(
            Object.values(markedForMove).map(async ({ store, path, name }) => {
              await doRename(
                joinURL(STORAGE, store, path, name),
                joinURL(params.store, params.path, name),
              );
            }),
          );
          dispatch(storageSlice.actions.clearMarksForMove());
        });
      }}
    ></Fab>
  );
}
