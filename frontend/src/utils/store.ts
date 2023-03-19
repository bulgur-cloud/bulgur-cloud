import { configureStore, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { api } from "../hooks/api";
import { BError } from "./error";
import { joinURL } from "./url";
import { createWrapper } from "next-redux-wrapper";

type LoadState = "done" | "loading" | "uninitialized";

export type AuthState = {
  username?: string;
  access_token?: string;
  state: LoadState;
  site?: string;
};

const initialAuthState: AuthState = { state: "uninitialized" };

export type LoginPayload = {
  username: string;
  site: string;
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
    },
  },
});

export type ActionCreateFolder = {
  type: "CreateFolder";
  path: string;
};
export type ActionBulkDelete = {
  type: "BulkDelete";
};
export type ActionDelete = {
  type: "Delete";
  path: string;
};
export type ActionRename = {
  type: "Rename";
  path: string;
};

export type StorageState = {
  /** Maps item names to full paths, for items that have been marked to be moved. */
  selected: {
    [fullpath: string]: {
      path: string;
      name: string;
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
  action?: ActionCreateFolder | ActionBulkDelete | ActionDelete | ActionRename;
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
        payload: { path: string; name: string };
      },
    ) => {
      const { path, name } = action.payload;
      const fullPath = joinURL(path, name);
      state.selected[fullPath] = {
        path,
        name,
      };
    },
    unmarkSelected: (
      state,
      action: { payload: { path: string; name: string } },
    ) => {
      const { path, name } = action.payload;
      const fullPath = joinURL(path, name);
      delete state.selected[fullPath];
    },
    toggleSelected: (
      state,
      action: { payload: { path: string; name: string } },
    ) => {
      console.log("toggle Selected called");
      const { path, name } = action.payload;
      const fullPath = joinURL(path, name);
      if (state.selected[fullPath]) {
        delete state.selected[fullPath];
      } else {
        state.selected[fullPath] = {
          path,
          name,
        };
      }
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
      } else if (
        // Probably a network connection error
        axios.isAxiosError(action.payload.error) &&
        action.payload.error.request !== undefined &&
        action.payload.error.response === undefined
      ) {
        error = new BError({
          code: "network_failure",
          description: "Make sure you have an internet connection.",
          title: "Failed to connect to the server",
        });
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

export const themeSlice = createSlice({
  name: "theme",
  initialState: {
    theme: "light",
  },
  reducers: {
    setTheme: (state, action: { payload: string }) => {
      state.theme = action.payload;
      console.log("setting theme");
      document
        .getElementsByTagName("html")[0]
        .setAttribute("data-theme", action.payload);
      // This gets picked up by `theme-setter.js` in the `public` folder.
      localStorage.setItem("bulgur-theme", action.payload);
    },
  },
});

function makeStore() {
  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      storage: storageSlice.reducer,
      error: errorSlice.reducer,
      theme: themeSlice.reducer,
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
}

type Store = ReturnType<typeof makeStore>;
export type RootState = ReturnType<Store["getState"]>;
export type AppDispatch = Store["dispatch"];

// Not actually used, we just need this to get Typescript to recognize the right type
const useAppDispatchWrap = () => useDispatch<AppDispatch>();
export const useAppDispatch: typeof useAppDispatchWrap = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const storeWrapper = createWrapper<Store>(makeStore);
