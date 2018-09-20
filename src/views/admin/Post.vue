<template>
  <div class="post-page">
    <h1>上传文章</h1>
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="60px">
      <el-form-item
        prop="title"
        label="标题">
        <el-input
          v-model="form.title" />
      </el-form-item>
      <el-form-item
        label="内容"
        prop="content">
        <el-input
          :rows="20"
          type="textarea"
          v-model="form.content" />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="onSubmit">
          立即创建
        </el-button>
        <el-button>
          取消
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HelloWorld from '@/components/HelloWorld.vue'

@Component({
  components: {
    HelloWorld
  }
})
export default class Home extends Vue {
  private form = {}
  private rules = {
    title: [
      { required: true, message: '请输入文章标题', trigger: 'blur' },
    ],
    content: [
      { required: true, message: '请输入文章内容', trigger: 'change' }
    ]
  }

  private onSubmit() {
    const form = this.$refs.form as any
    form.validate((valid: boolean) => {
      if (valid) {
        fetch('/api/post', {
          method: 'post',
          headers: {
              "Content-Type": "application/json"
          },
          body:  JSON.stringify(this.form)
        })
      } else {
        console.log('error submit!!');
        return false;
      }
    })
  }
}
</script>

<style lang="stylus" scoped>
.post-page
  padding 50px
</style>