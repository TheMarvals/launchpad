<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import type { SliderItem } from '../data/slider-demo';

interface Props {
  items: SliderItem[];
  gap?: number;
  wheelMultiplier?: number;
  dragMultiplier?: number;
  ease?: number;
  friction?: number;
  loop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  gap: 48,
  wheelMultiplier: 1.0,
  dragMultiplier: 1.2,
  ease: 0.08,
  friction: 0.92,
  loop: true,
});

const emit = defineEmits<{
  (e: 'select', item: SliderItem, index: number): void;
  (e: 'velocity', velocity: number): void;
}>();

// DOM Refs
const viewportRef = ref<HTMLDivElement | null>(null);
const slideRefs = ref<HTMLElement[]>([]);

// Layout State
const viewportWidth = ref(1200);
const viewportHeight = ref(800);
const slideWidth = ref(520);
const slideHeight = ref(380);

// If item count is small (e.g., < 5), repeat virtual items so viewport is always filled seamlessly
const virtualItems = computed(() => {
  if (!props.items || props.items.length === 0) return [];
  const minItemsNeeded = 6;
  const repeatCount = Math.max(1, Math.ceil(minItemsNeeded / props.items.length));
  
  const list: Array<{ item: SliderItem; originalIndex: number; virtualId: string }> = [];
  for (let r = 0; r < repeatCount; r++) {
    props.items.forEach((item, originalIndex) => {
      list.push({
        item,
        originalIndex,
        virtualId: `${item.id}-${r}`,
      });
    });
  }
  return list;
});

// Physics Engine State
let targetX = 0;
let currentX = 0;
let previousX = 0;
let velocityX = 0;
let isPointerDown = false;
let isDragging = false;
let suppressClickUntil = 0;

// Drag tracking for velocity & momentum
let startPointerX = 0;
let startScrollX = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let pointerVelocity = 0;

let animationFrameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

// Total track stride and cycle width
const itemStride = computed(() => slideWidth.value + props.gap);
const totalWidth = computed(() => virtualItems.value.length * itemStride.value);

// Update Measurements
function updateMeasurements() {
  if (!viewportRef.value) return;
  const rect = viewportRef.value.getBoundingClientRect();
  viewportWidth.value = rect.width || window.innerWidth;
  viewportHeight.value = rect.height || window.innerHeight;

  // Responsive slide sizing matching Jesper Landberg (43.5svh height, ~16:10 aspect)
  const isMobile = viewportWidth.value < 768;
  if (isMobile) {
    slideWidth.value = Math.min(viewportWidth.value * 0.82, 420);
    slideHeight.value = slideWidth.value * 0.65;
  } else {
    slideHeight.value = Math.min(520, Math.max(260, viewportHeight.value * 0.435));
    slideWidth.value = Math.min(680, Math.round(slideHeight.value * 1.55));
  }
}

// Wheel Handler: Convert vertical & horizontal scroll into continuous targetX movement
function handleWheel(e: WheelEvent) {
  // Prevent browser back/forward navigation gestures if deltaX is used
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(delta) < 1) return;

  targetX -= delta * props.wheelMultiplier;
}

// Pointer Events (Unified Mouse + Touch)
function handlePointerDown(e: PointerEvent) {
  if (!viewportRef.value) return;

  // A new gesture is necessarily an intentional interaction. Clearing this
  // here preserves the drag's own synthetic-click guard while allowing the
  // very next user click to activate a slide without waiting for a timeout.
  suppressClickUntil = 0;
  isPointerDown = true;
  isDragging = false;
  startPointerX = e.clientX;
  lastPointerX = e.clientX;
  lastPointerTime = performance.now();
  startScrollX = targetX;
  pointerVelocity = 0;

  viewportRef.value.classList.add('is-dragging');
  try {
    viewportRef.value.setPointerCapture(e.pointerId);
  } catch {}
}

function handlePointerMove(e: PointerEvent) {
  if (!isPointerDown) return;

  const now = performance.now();
  const dt = Math.max(1, now - lastPointerTime);
  const dx = e.clientX - lastPointerX;

  // Real-time instantaneous pointer velocity (px/frame normalized to 16ms)
  pointerVelocity = (dx / dt) * 16;
  lastPointerX = e.clientX;
  lastPointerTime = now;

  const totalDelta = e.clientX - startPointerX;
  if (Math.abs(totalDelta) > 5) {
    isDragging = true;
  }

  targetX = startScrollX + totalDelta * props.dragMultiplier;
}

function handlePointerUp(e: PointerEvent) {
  if (!isPointerDown) return;
  isPointerDown = false;
  const wasDragging = isDragging;
  isDragging = false;

  if (viewportRef.value) {
    viewportRef.value.classList.remove('is-dragging');
    try {
      viewportRef.value.releasePointerCapture(e.pointerId);
    } catch {}
  }

  // Apply release momentum
  const momentum = pointerVelocity * 18 * props.friction;
  targetX += momentum;

  // A drag is followed by a synthetic click in most browsers. Ignore only that
  // immediate event, rather than leaving the slider in a dragging state that
  // also blocks the user's next intentional click.
  if (wasDragging) {
    suppressClickUntil = performance.now() + 100;
  }
}

function handleSlideClick(item: SliderItem, originalIndex: number, e: MouseEvent) {
  if (performance.now() < suppressClickUntil) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  emit('select', item, originalIndex);
}

// Main 60fps RequestAnimationFrame Physics & Render Loop
function tick() {
  const diff = targetX - currentX;
  currentX += diff * props.ease;

  // Velocity calculation
  velocityX = currentX - previousX;
  previousX = currentX;

  // Emit velocity for external listeners / shaders
  if (Math.abs(velocityX) > 0.01) {
    emit('velocity', velocityX);
  }

  // Update CSS Custom Variables on Viewport
  if (viewportRef.value) {
    viewportRef.value.style.setProperty('--velocity-x', velocityX.toFixed(3));
    viewportRef.value.style.setProperty('--velocity', Math.abs(velocityX).toFixed(3));
  }

  // Continuous Infinite Wrapping
  const total = totalWidth.value;
  const stride = itemStride.value;
  const halfTotal = total / 2;

  if (total > 0 && slideRefs.value.length > 0) {
    virtualItems.value.forEach((_, idx) => {
      const el = slideRefs.value[idx];
      if (!el) return;

      // Base un-wrapped coordinate
      const baseX = idx * stride;
      const rawX = baseX + currentX;

      // Symmetric modulo wrapping centered around 0 [-halfTotal, +halfTotal]
      let wrappedX = (((rawX + halfTotal) % total) + total) % total - halfTotal;

      // Direct GPU Transform
      el.style.transform = `translate3d(${wrappedX.toFixed(2)}px, 0px, 0px)`;
    });
  }

  animationFrameId = requestAnimationFrame(tick);
}

onMounted(async () => {
  await nextTick();
  updateMeasurements();

  if (viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });
    resizeObserver.observe(viewportRef.value);
  }

  window.addEventListener('resize', updateMeasurements, { passive: true });
  animationFrameId = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  window.removeEventListener('resize', updateMeasurements);
});

// Set slide refs helper
function setSlideRef(el: any, idx: number) {
  if (el) {
    slideRefs.value[idx] = el.$el || el;
  }
}
</script>

<template>
  <div class="jesper-slider-root">
    <div
      ref="viewportRef"
      class="jesper-slider-viewport"
      @wheel.passive="handleWheel"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
      :style="{
        '--slide-w': `${slideWidth}px`,
        '--slide-h': `${slideHeight}px`,
      }"
    >
      <div class="jesper-slider-track">
        <article
          v-for="(vItem, idx) in virtualItems"
          :key="vItem.virtualId"
          :ref="(el) => setSlideRef(el, idx)"
          class="jesper-slide"
          @click="(e) => handleSlideClick(vItem.item, vItem.originalIndex, e)"
        >
          <a
            :href="vItem.item.href || '#'"
            class="jesper-slide-inner"
            :tabindex="0"
            :aria-label="vItem.item.title"
          >
            <img
              :src="vItem.item.image"
              :alt="vItem.item.alt || vItem.item.title"
              class="jesper-slide-img"
              loading="lazy"
              draggable="false"
            />
            <div class="jesper-slide-vignette" />

            <div class="jesper-slide-meta">
              <span class="jesper-slide-title">{{ vItem.item.title }}</span>
              <span class="jesper-slide-arrow" aria-hidden="true">→</span>
            </div>
          </a>
        </article>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/jesper-slider.css';
</style>
