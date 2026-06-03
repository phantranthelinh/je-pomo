import { router } from '../trpc';
import { timerRouter } from './timer';
import { soundRouter } from './sound';
import { userRouter } from './user';

export const appRouter = router({
  timer: timerRouter,
  sound: soundRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
