import { confighubApi } from '@confighub/rtk-query';
import { configureStore } from '@reduxjs/toolkit';

// Standard RTK Query store wiring: mount the ConfigHub api's reducer and middleware.
export const store = configureStore({
  reducer: {
    [confighubApi.reducerPath]: confighubApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(confighubApi.middleware),
});
