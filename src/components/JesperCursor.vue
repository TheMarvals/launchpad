<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface Props {
  mode?: 'default' | 'drag' | 'view';
}

withDefaults(defineProps<Props>(), {
  mode: 'default',
});

const cursorX = ref(-100);
const cursorY = ref(-100);
const targetX = ref(-100);
const targetY = ref(-100);
const isVisible = ref(false);

let rafId: number | null = null;

function onMouseMove(e: MouseEvent) {
  targetX.value = e.clientX;
  targetY.value = e.clientY;
  if (!isVisible.value) isVisible.value = true;
}

function onMouseLeave() {
  isVisible.value = false;
}

function updateCursor() {
  cursorX.value += (targetX.value - cursorX.value) * 0.15;
  cursorY.value += (targetY.value - cursorY.value) * 0.15;
  rafId = requestAnimationFrame(updateCursor);
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);
  rafId = requestAnimationFrame(updateCursor);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseleave', onMouseLeave);
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div
    class="jesper-cursor"
    :class="[`mode-${mode}`, { 'is-visible': isVisible }]"
    :style="{
      transform: `translate3d(${cursorX}px, ${cursorY}px, 0px) translate(-50%, -50%)`,
    }"
  >
    <div class="jesper-cursor-inner">
      <span v-if="mode === 'drag'" class="cursor-text">DRAG</span>
      <span v-else-if="mode === 'view'" class="cursor-text">VIEW</span>
    </div>
  </div>
</template>

<style scoped>
.jesper-cursor {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
  will-change: transform;
}

.jesper-cursor.is-visible {
  opacity: 1;
}

.jesper-cursor-inner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffffff;
  mix-blend-mode: difference;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s cubic-bezier(0.23, 1, 0.32, 1),
              height 0.3s cubic-bezier(0.23, 1, 0.32, 1),
              background 0.3s ease;
}

.mode-drag .jesper-cursor-inner,
.mode-view .jesper-cursor-inner {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  mix-blend-mode: normal;
}

.cursor-text {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #000000;
}
</style>
