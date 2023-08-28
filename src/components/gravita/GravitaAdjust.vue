<script setup lang="ts">
import { computed} from 'vue'
import { useCoreStore } from '../../store/core'
import { useActionStore } from '../../store/action'

const core = useCoreStore()
const actionStore = useActionStore()
</script>

<template>
{{ core.getAggregatedActiveVessels }}
</template>