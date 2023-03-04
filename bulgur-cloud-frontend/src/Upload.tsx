import { Fab, Icon, View } from "native-base";
import { Platform } from "react-native";
import { runAsync, STORAGE } from "./client/base";
import { useCreateFolder, useUpload } from "./client/storage";
import { ERR_NOT_IMPLEMENTED } from "../../frontend/src/utils/error";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  StorageAction,
  storageSlice,
  useAppDispatch,
  useAppSelector,
} from "./store";
import { DashboardParams } from "./routes";
import { joinURL } from "./fetch";
import { FilenameModal } from "./components/FilenameModal";

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

export function CreateNewFolder(props: DashboardParams) {
  const dispatch = useAppDispatch();
  const { store, path } = props.route.params;

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
          dispatch(
            storageSlice.actions.promptAction({
              type: StorageAction.CreateFolder,
              isFile: false,
              name: "",
              store,
              path,
            }),
          );
        }}
      ></Fab>
    </View>
  );
}

export function CreateFolderModal() {
  const { doCreateFolder } = useCreateFolder();
  const action = useAppSelector(({ storage: { action } }) =>
    action?.type !== StorageAction.CreateFolder ? undefined : action,
  );
  const dispatch = useAppDispatch();

  if (action === undefined) return <></>;
  const { store, path } = action;

  function runCreateFolder(name: string) {
    runAsync(async () => {
      // An empty upload will just create the folder in the path
      await doCreateFolder(joinURL(STORAGE, store, path, name));
    });
  }

  return (
    <FilenameModal
      onDismiss={() => {
        dispatch(storageSlice.actions.dismissPrompt());
      }}
      title="Create new folder"
      placeHolder="Enter a name for the new folder"
      primary="Create"
      actions={{ Create: { message: "Create", action: runCreateFolder } }}
    />
  );
}
