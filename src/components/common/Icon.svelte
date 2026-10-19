<script lang="ts">
  import {
    Home,
    Settings,
    LogOut,
    X,
    Play,
    Mic,
    MicOff,
    Send,
    Volume2,
    VolumeX,
    Square,
    Keyboard,
    Clock,
    Loader2,
    AlertTriangle,
    AlertCircle,
    ShieldCheck,
    Info,
    Check,
    CheckCircle2,
    Trash2,
    Key,
    ExternalLink,
    ArrowLeft,
    ArrowRight,
    Printer,
    Copy,
    Upload
  } from 'lucide-svelte';

  const icons: Record<string, any> = {
    'home': Home,
    'settings': Settings,
    'logout': LogOut,
    'x': X,
    'close': X,
    'play': Play,
    'mic': Mic,
    'mic-off': MicOff,
    'send': Send,
    'volume': Volume2,
    'volume-2': Volume2,
    'volume-x': VolumeX,
    'square': Square,
    'stop': Square,
    'keyboard': Keyboard,
    'clock': Clock,
    'loader': Loader2,
    'alert-triangle': AlertTriangle,
    'alert-circle': AlertCircle,
    'shield-check': ShieldCheck,
    'info': Info,
    'check': Check,
    'check-circle': CheckCircle2,
    'trash': Trash2,
    'key': Key,
    'external-link': ExternalLink,
    'arrow-left': ArrowLeft,
    'arrow-right': ArrowRight,
    'printer': Printer,
    'copy': Copy,
    'upload': Upload
  };

  export let name: string;
  export let size: number = 16;
  export let strokeWidth = 1.5;
  let className = '';
  export { className as class };

  $: iconComponent = icons[name.toLowerCase()] || Info;
</script>

<svelte:component
  this={iconComponent}
  {size}
  {strokeWidth}
  class={className}
  aria-hidden="true"
/>
