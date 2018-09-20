<template>
  <div class="post">
    <h1>{{data.title}}</h1>
    <div class="content" v-html="data.content"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import marked from 'marked'

@Component
export default class Home extends Vue {
  private data = {}

  private async mounted() {
    const result = await fetch(`/api/post/${this.$route.params.id}`)
    const data = await result.json()
    this.data = data
    this.data.content = marked(this.data.content)
    setTimeout(() => {
      const imgs = this.$el.querySelectorAll('img')
      for (const img of imgs) {
        const tip = document.createElement('span')
        tip.innerText = img.getAttribute('alt') || ''
        tip.className = 'tip'
        const imgParent = img.parentElement
        if (imgParent) {
          imgParent.appendChild(tip)
          imgParent.className = 'img-parent'
        }
      }
    })
  }
}
</script>

<style lang="stylus" scoped>
.post >>> img
  width 100%

.post >>> p
  text-align left

.post >>> p:not(.img-parent)
  text-indent 2em
  padding 20px

.post >>> p.img-parent
  text-align center

.post >>> span.tip
  font-size 14px
  color #9
  margin-top 5px
  padding 0
</style>
