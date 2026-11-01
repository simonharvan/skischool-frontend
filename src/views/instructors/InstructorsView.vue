<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import InstructorEditDrawer from '@/components/instructors/InstructorEditDrawer.vue'
import { deleteInstructor } from '@/api/instructors'
import { PLACEHOLDER_INSTRUCTOR_EMAIL, useInstructorsStore } from '@/stores/instructors'
import type { Instructor } from '@/types'
import { formatPhone } from '@/utils/format'

const { t } = useI18n()
const store = useInstructorsStore()
const drawer = ref<InstanceType<typeof InstructorEditDrawer>>()

const list = computed(() => store.all.filter((i) => i.email !== PLACEHOLDER_INSTRUCTOR_EMAIL))

const teachingFilters = computed(() => [
  { text: t('instructor.ski'), value: 'ski' },
  { text: t('instructor.snb'), value: 'snb' },
  { text: t('instructor.both'), value: 'both' },
])
/** "both" instructors teach either, so they pass every filter. */
const filterTeaching = (value: string, row: Instructor) => row.teaching === 'both' || row.teaching === value

async function remove(row: Instructor) {
  await deleteInstructor(row.id)
  ElMessage.success(t('messages.successDelete'))
  await store.load()
}
</script>

<template>
  <div>
    <el-button type="primary" :icon="Plus" class="mb-4" @click="drawer?.open()">{{ t('instructor.create') }}</el-button>

    <el-table :data="list" row-key="id" class="w-full">
      <el-table-column prop="name" :label="t('instructor.name')" min-width="160" />
      <el-table-column prop="email" :label="t('instructor.email')" min-width="200" />
      <el-table-column :label="t('instructor.phone')" min-width="140">
        <template #default="{ row }">{{ formatPhone(row.phone) }}</template>
      </el-table-column>
      <el-table-column :label="t('instructor.gender')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.gender === 'male' ? 'primary' : 'danger'" size="small">
            {{ t(`instructor.${row.gender}`) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        :label="t('instructor.teaching')"
        width="130"
        :filters="teachingFilters"
        :filter-method="filterTeaching"
      >
        <template #default="{ row }">
          <el-tag :type="row.teaching === 'ski' ? 'primary' : row.teaching === 'snb' ? 'danger' : 'success'" size="small">
            {{ t(`instructor.${row.teaching}`) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('actions')" width="190" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="drawer?.open(row as Instructor)">{{ t('edit') }}</el-button>
          <el-popconfirm
            :title="t('instructor.areYouSure')"
            :confirm-button-text="t('confirm')"
            :cancel-button-text="t('cancel')"
            @confirm="remove(row as Instructor)"
          >
            <template #reference><el-button size="small" type="danger">{{ t('delete') }}</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <InstructorEditDrawer ref="drawer" @saved="store.load()" />
  </div>
</template>
