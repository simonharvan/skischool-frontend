<template>
  <div id="app">
    <router-view />
    <service-worker-update-popup />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ServiceWorkerUpdatePopup from '@/pwa/components/ServiceWorkerUpdatePopup.vue'
import {InstructorsModule} from "@/store/modules/instructor";

@Component({
  name: 'App',
  components: {
    ServiceWorkerUpdatePopup
  }
})
export default class extends Vue {
  mounted() {
    InstructorsModule.GetInstructors({name: null, gender: null, teaching: null, date: null})
  }
}
</script>
