<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import Icon from './Icon.svelte';

  export let title: string;
  export let message: string;
  export let confirmLabel: string;
  export let cancelLabel: string;
  export let danger = false;

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();
  let confirmButton: HTMLButtonElement;

  onMount(() => {
    confirmButton?.focus();
  });

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('cancel');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/50 dark:bg-black/70 backdrop-blur-sm" role="presentation" on:click|self={() => dispatch('cancel')}>
  <div
    class="bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark w-full max-w-md text-ink dark:text-ink-dark shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    aria-describedby="confirm-modal-message"
  >
    <div class="px-6 pt-6 pb-5 flex items-start gap-4">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 {danger ? 'bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20' : 'bg-accent/10 dark:bg-accent-dark/15 text-accent dark:text-accent-dark ring-1 ring-accent/20'}">
        <Icon name={danger ? 'alert-triangle' : 'info'} size={18} />
      </div>
      <div class="space-y-1.5 min-w-0 flex-1">
        <h2 id="confirm-modal-title" class="font-serif text-xl font-medium tracking-tight text-ink dark:text-ink-dark leading-snug">
          {title}
        </h2>
        <p id="confirm-modal-message" class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed font-sans">
          {message}
        </p>
      </div>
    </div>

    <div class="px-6 py-4 bg-paper-surface/70 dark:bg-paper-surface-dark/50 border-t border-hairline dark:border-hairline-dark flex items-center justify-end gap-3 font-sans font-medium text-xs">
      <button
        type="button"
        on:click={() => dispatch('cancel')}
        class="min-h-[40px] px-4 py-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-xl hover:bg-hairline/50 dark:hover:bg-hairline-dark/50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink dark:focus-visible:ring-ink-dark whitespace-nowrap"
      >
        {cancelLabel}
      </button>
      <button
        bind:this={confirmButton}
        type="button"
        on:click={() => dispatch('confirm')}
        class="min-h-[40px] px-4 py-2 transition-all rounded-xl shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 whitespace-nowrap {danger
          ? 'bg-red-600 hover:bg-red-500 text-white focus-visible:ring-red-500'
          : 'bg-ink hover:bg-ink/90 dark:bg-ink-dark dark:hover:bg-ink-dark/90 text-paper dark:text-paper-dark focus-visible:ring-ink'}"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
