import { configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { api } from "./api";

type LoadState = "done" | "loading" | "uninitialized";

export type AuthState = {
  username?: string;
  password?: string;
  token?: string;
  state: LoadState;
  site?: string;
};

const initialAuthState: AuthState = { state: "uninitialized" };

export type LoginPayload = {
  username: string;
  password: string;
  site: string;
  token: string;
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
      state.password = action.payload.password;
      state.token = action.payload.token;
      state.site = action.payload.site;
    },
    markLoading: (state) => {
      state.state = "loading";
    },
    logout: (state) => {
      state.state = "done";
      state.username = undefined;
      state.password = undefined;
      state.token = undefined;
    },
  },
});

export type StorageState = {
  currentPath: string;
  contents: api.FolderEntry[];
  is_folder: boolean;
  state: LoadState;
  /** Maps item names to full paths, for items that have been marked to be moved. */
  markedForMove: { [name: string]: string };
};

const initialStorageState: StorageState = {
  currentPath: "/",
  contents: [],
  is_folder: true,
  state: "uninitialized",
  markedForMove: {},
};

export type LoadFolderPayload = api.FolderResults & { currentPath: string };
export type LoadFilePayload = api.FolderEntry & { currentPath: string };

export const storageSlice = createSlice({
  name: "storage",
  initialState: initialStorageState,
  reducers: {
    loadFolder: (state, action: { payload: LoadFolderPayload }) => {
      state.contents = action.payload.entries;
      state.currentPath = action.payload.currentPath;
      state.is_folder = true;
      state.state = "done";
    },
    loadFile: (state, action: { payload: LoadFilePayload }) => {
      state.contents = [];
      state.currentPath = action.payload.currentPath;
      state.is_folder = false;
      state.state = "done";
    },
    markLoading: (state) => {
      state.state = "loading";
    },
    markForMove: (
      state,
      action: { payload: { name: string; path: string } },
    ) => {
      state.markedForMove[action.payload.name] = action.payload.path;
    },
    clearMarksForMove: (state) => {
      state.markedForMove = {};
    },
  },
});

type ErrorState = {
  errors: { [key: string]: any };
};

const initialErrorsState: ErrorState = {
  errors: {},
};

export const errorSlice = createSlice({
  name: "error",
  initialState: initialErrorsState,
  reducers: {
    addError: (state, action: { payload: { key: string; error: any } }) => {
      state.errors[action.payload.key] = action.payload.error;
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
