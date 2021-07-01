import Vue from "vue";
import VueRouter from "vue-router";
import Login from "../view/login/index";
import Layout from "../view/layout/index";
import { createMenus, createDefaultVisitedBar, listToTree } from "@/utils/app";
import { SYSTEM_CONFIG } from "@/config";
import store from "../store";

Vue.use(VueRouter);

/**
 * 系统路由
 */
const systemRoutes = [
  {
    path: "/",
    name: "layout",
    component: Layout,
    children: [
      {
        path: "/",
        name: "goodsHome",
        component: () => import("@/view/goods/home/index.vue"),
        meta: {
          text: "首页",
          defaultVisited: true,
        },
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  {
    path: "/",
    name: "layout",
    component: Layout,
    children: [
      {
        path: "/usercenter",
        name: "usercenter",
        component: () => import("@/view/user/index.vue"),
        meta: {
          text: "个人中心",
        },
      },
    ],
  },
];

/**
 * 静态菜单路由
 */
export const constantRoutes = [
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/users",
        name: "users",
        component: () => import("../components/CrudTable.vue"),
        props: { namespace: "/rest/users" },
        meta: {
          text: "用户管理",
          icon: "mdi-account",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/roles",
        name: "roles",
        component: () => import("../components/CrudTable.vue"),
        props: { namespace: "/rest/roles" },
        meta: {
          text: "角色管理",
          icon: "mdi-account-cowboy-hat",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/organs",
        name: "organs",
        component: () => import("../components/CrudTree.vue"),
        props: { namespace: "/rest/organs" },
        meta: {
          text: "组织机构管理",
          icon: "mdi-file-tree-outline",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/menus",
        name: "menus",
        component: () => import("../components/CrudTree.vue"),
        props: { namespace: "/rest/menus" },
        meta: {
          text: "菜单管理",
          icon: "mdi-microsoft-xbox-controller-menu",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/resources",
        name: "resources",
        component: () => import("../components/CrudTable.vue"),
        props: { namespace: "/rest/resources" },
        meta: {
          text: "资源管理",
          icon: "mdi-semantic-web",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/scopes",
        name: "scopes",
        component: () => import("../view/system/DataScopes.vue"),
        props: { namespace: "/rest/scopes" },
        meta: {
          text: "数据范围管理",
          icon: "mdi-account-arrow-left",
        },
      },
    ],
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "/auth",
        name: "auth",
        component: () => import("../view/system/Authority.vue"),
        props: { namespace: "/rest/auth" },
        meta: {
          text: "权限管理",
          icon: "mdi-shield-account-outline",
        },
      },
    ],
  },
];

const router = new VueRouter({
  routes: [...systemRoutes],
});

router.beforeEach((to, from, next) => {
  console.log(to.path);
  if (to.path === "/login") {
    next();
    return
  }
  if (
    store.state.user.token ||
    SYSTEM_CONFIG.permitUrls.some((i) => i === to.path)
  ) {
    if (store.state.user.token && !store.state.user.userOnlineInfo) {
      store
        .dispatch("user/getCurrent")
        .then(() => {          
          addRouters();
          router.replace({ ...to});
        })
        .catch(() => {
          if(to.path!='/login')
            router.replace("/login");
        });
    } else {
      //   addRouters();
      next();
    }
  } else {
    router.replace("/login");
  }
});

// store.state.menu.menus = createMenus(constantRoutes);
const addRouters = () => {
  const menus = store.state.user.userOnlineInfo.menus;
  let menuTree = [];
  listToTree(menus, menuTree, undefined);
  
  menus
    .filter((menu) => menu.path)
    .map((menu) => {
      const parent = menus.filter(
        (menuItem) => menuItem.resourceId === menu.parentId
      )[0];
      router.addRoute({
        path: "/",
        component: Layout,
        children: [
          {
            path: menu.path || "",
            name: menu.resourceName,
            component: loadComponent(menu.component),
            props: { namespace: menu.path },
            meta: {
              id: menu.resourceId,
              parentId: menu.parentId,
              text: menu.resourceName,
              icon: menu.icon,
              parent,
            },
          },
        ],
      });
    });
  

  if (menuTree.length === 0) {
    menuTree = menus;
  }
  store.state.menu.menus = createMenus(menuTree);
  store.state.menu.inited = true;
};

const loadComponent = (component) => {
  //必须@/
  return (resolve) => require([`@/${component}`], resolve);
};
store.state.visited.visitedItems = createDefaultVisitedBar(systemRoutes);
export default router;
