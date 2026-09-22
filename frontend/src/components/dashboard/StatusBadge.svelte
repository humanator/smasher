<script lang="ts">
  // ABOUTME: Presentational status pill for a run's lifecycle state
  // ABOUTME: Color-codes Running/Completed/Failed/Aborted per the backend's RunStatus values

  let { status }: { status: string } = $props();
</script>

<span class="status status-{status.toLowerCase()}">{status}</span>

<style>
  .status {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-running {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-completed {
    background: #dcfce7;
    color: #15803d;
  }

  .status-failed {
    background: #fee2e2;
    color: #b91c1c;
  }

  .status-aborted,
  .status-cancelled {
    background: #f1f5f9;
    color: #475569;
  }
</style>
