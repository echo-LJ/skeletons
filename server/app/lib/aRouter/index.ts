import { Application, Context, Router } from 'egg';

enum RequestMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  ALL = 'all',
  PATCH = 'patch'
}

/**
 * 路由注入
 */
class ARouterHelper {
  /**
   * 临时存放controller以及路由
   */
  controllers: {
      [key: string]: {
      prefix?: string, // 前缀
      target?: any, // 对应的class
      routers: Array<{ // controller下的路由
          handler: string, // 方法名
          path: string, // 路由路径
          method: RequestMethods // 请求方法
      }>
  }} = {};

  /**
   * 注入路由
   * @param router egg的路由
   */
  public injectRouter(router: Router) {
      const keys = Object.keys(this.controllers);
      console.log(35, this.controllers, router)
      keys.forEach(key => {
          const controller = this.controllers[key];
          controller.routers.forEach(r => {
              // 以前的写法是router.get('/xxx', xxx, controller.xxx.xxx);
              // 这里直接批量注入，controller.prefix + r.path拼接公共前缀于路由路径
              router[r.method](controller.prefix + r.path, async (ctx: Context) => {
                  // 得到class实例
                  const instance = new controller.target(ctx);
                  // 获取class中使用的装饰器中间件
                  const middlewares = controller.target.prototype._middlewares;
                  if (middlewares) {
                      // all是绑定在class上的，也就是下面所有的方法都需先经过all中间件
                      const all = middlewares.all;
                      for (let i = 0; i < all.length; ++i) {
                          const func = all[i];
                          await func(ctx);
                      }
                      // 这是方法自带的中间件
                      const self = middlewares[r.handler] || [];
                      for (let i = 0; i < self.length; ++i) {
                          const func = self[i];
                          await func(ctx);
                      }
                  }
                  console.log(60,r)
                  // 经过了所有中间件，最后才真正执行调用的方法
                  await instance[r.handler]();
              });
          });
      });
  }
}
const aRouterHelper = new ARouterHelper();

  /**
 * 抛出hwrouter，在router.ts中直接使用ARouter(app);即可完成自动注入路由
 * @param app application
 * @param options 参数，目前只有prefix，就是所有路由的前缀
 */
export function ARouter(app: Application, options?: {prefix?: string}) {
  const { router } = app;
  if (options && options.prefix) {
      router.prefix(options.prefix);
  }
  aRouterHelper.injectRouter(router);
}