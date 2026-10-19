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

<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/40 dark:bg-black/60" role="presentation" on:click|self={() => dispatch('cancel')}>
  <div
    class="bg-paper dark:bg-paper-dark border border-hairline dark:border-hairline-dark w-full max-w-md text-ink dark:text-ink-dark shadow-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-modal-title"
    aria-describedby="confirm-modal-message"
  >
    <div class="px-6 py-5 border-b border-hairline dark:border-hairline-dark flex items-start gap-3">
      <Icon name={danger ? 'alert-triangle' : 'info'} size={19} class={danger ? 'text-red-700 dark:text-red-400 mt-0.5 shrink-0' : 'text-accent dark:text-accent-dark mt-0.5 shrink-0'} />
      <div class="space-y-1">
        <h2 id="confirm-modal-title" class="font-serif text-xl font-normal tracking-tight">
          {title}
        </h2>
        <p id="confirm-modal-message" class="text-sm text-ink-muted dark:text-ink-muted-dark leading-relaxed">
          {message}
        </p>
      </div>
    </div>

    <div class="px-6 py-4 flex justify-end gap-3 font-mono text-xs">
      <button
        type="button"
        on:click={() => dispatch('cancel')}
        class="px-3 py-2 text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark transition-colors rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-ink dark:focus-visible:ring-ink-dark"
      >
        {cancelLabel}
      </button>
      <button
        bind:this={confirmButton}
        type="button"
        on:click={() => dispatch('confirm')}
        class="px-4 py-2 transition-colors rounded-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-paper-dark {danger
          ? 'bg-red-700 hover:bg-red-800 text-paper focus-visible:ring-red-700'
          : 'bg-accent hover:bg-accent-hover dark:bg-accent-dark dark:hover:bg-accent-dark-hover text-paper dark:text-paper-dark focus-visible:ring-accent'}"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
</div>
