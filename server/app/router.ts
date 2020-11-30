import { Application } from 'egg';
import { ARouter } from './lib/aRouter';

export default (app: Application) => {
  
  // const { controller, router } = app;
  ARouter(app);
  // router.get('/', controller.home.index);
};
