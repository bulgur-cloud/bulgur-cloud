import { configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { api } from "./api";
import { BError } from "./error";
import { joinURL } from "./fetch";

type LoadState = "done" | "loading" | "uninitialized";

export type AuthState = {
  username?: string;
  refresh_token?: string;
  access_token?: string;
  state: LoadState;
  site?: string;
};

const initialAuthState: AuthState = { state: "uninitialized" };

export type LoginPayload = {
  username: string;
  site: string;
  refresh_token: string;
  access_token: string;
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {
    setSite: (state, action: { payload: string }) => {
      state.site = action.payload;
    },
    login: (state, action: { payload: LoginPayload }) => {
      state.state = "done";
      state.username = action.payload.username;
      state.refresh_token = action.payload.refresh_token;
      state.access_token = action.payload.access_token;
      state.site = action.payload.site;
    },
    markLoading: (state) => {
      state.state = "loading";
    },
    logout: (state) => {
      state.state = "done";
      state.username = undefined;
      state.access_token = undefined;
      state.refresh_token = undefined;
    },
  },
});

export enum StorageAction {
  Rename = "Rename",
  Delete = "Delete",
  CreateFolder = "Create Folder",
}

export type StorageState = {
  /** Maps item names to full paths, for items that have been marked to be moved. */
  selected: {
    [fullpath: string]: {
      store: string;
      path: string;
      name: string;
      isFile: boolean;
    };
  };
  /** Maps file names to their current upload progress. */
  uploadProgress: {
    [filename: string]: {
      name: string;
      total: number;
      done: number;
    };
  };
  action?:
    | {
        type: StorageAction;
        isFile: boolean;
        name: string;
        store: string;
        path: string;
      }
    | { type: "BulkDelete" };
};

const initialStorageState: StorageState = {
  selected: {},
  uploadProgress: {},
  action: undefined,
};

export type LoadFolderPayload = api.FolderResults;
export type LoadFilePayload = api.FolderEntry;

export const storageSlice = createSlice({
  name: "storage",
  initialState: initialStorageState,
  reducers: {
    markSelected: (
      state,
      action: {
        payload: { store: string; path: string; name: string; isFile: boolean };
      },
    ) => {
      const { store, path, name, isFile } = action.payload;
      const fullPath = joinURL(store, path, name);
      state.selected[fullPath] = {
        store,
        path,
        name,
        isFile,
      };
    },
    unmarkSelected: (
      state,
      action: { payload: { store: string; path: string; name: string } },
    ) => {
      const { store, path, name } = action.payload;
      const fullPath = joinURL(store, path, name);
      if (state.selected[fullPath]) delete state.selected[fullPath];
    },
    clearAllSelected: (state) => {
      state.selected = {};
    },
    uploadProgress: (
      state,
      action: { payload: { name: string; total: number; done: number } },
    ) => {
      const { name, total, done } = action.payload;
      state.uploadProgress[name] = {
        name,
        total,
        done,
      };
      if (done === total) {
        delete state.uploadProgress[name];
      }
    },
    promptAction: (
      state,
      action: {
        payload: Required<StorageState>["action"];
      },
    ) => {
      state.action = {
        ...action.payload,
      };
    },
    dismissPrompt: (state) => {
      state.action = undefined;
    },
  },
});

type ErrorState = {
  errors: { [key: string]: BError };
};

const initialErrorsState: ErrorState = {
  errors: {},
};

export const errorSlice = createSlice({
  name: "error",
  initialState: initialErrorsState,
  reducers: {
    addError: (state, action: { payload: { key: string; error: unknown } }) => {
      let error: BError;
      if (action.payload.error instanceof BError) {
        error = action.payload.error;
      } else {
        error = new BError({
          code: "unknown_error",
          description: `Please send a bug report with the following message: ${JSON.stringify(
            action.payload.error,
          )}`,
          title: "An unexpected error occured",
        });
      }
      state.errors[action.payload.key] = error;
    },
    clearError: (state, action: { payload: string }) => {
      delete state.errors[action.payload];
    },
  },
});

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    storage: storageSlice.reducer,
    error: errorSlice.reducer,
  },
  middleware: [
    // Log all actions for debugging
    (store: any) => (next: any) => (action: any) => {
      console.group(action?.type);
      console.info("dispatching", action);
      const result = next(action);
      console.log("next state", store.getState());
      console.groupEnd();
      return result;
    },
  ],
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Added to get Typescript to recognize the right type with `typeof ...`
const useAppDispatchWrap = () => useDispatch<AppDispatch>();
export const useAppDispatch: typeof useAppDispatchWrap = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
