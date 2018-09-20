export default {
  path: '/admin',
  name: 'admin',
  component: () => import('./Index.vue'),
  children: [
    {
      path: 'post',
      name: 'post',
      component: () => import('./Post.vue')
    }
  ]
}
