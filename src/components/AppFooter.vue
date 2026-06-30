<template>
  <footer class="footer">
    <p>API: <a href="api/pc.txt">api/pc.txt</a> · <a href="api/phone.txt">api/phone.txt</a> · <a href="api/all.txt">api/all.txt</a> · <a href="manifest.json">manifest.json</a></p>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.8rem;
  border-top: 1px solid var(--border);
}

.footer a {
  color: var(--accent);
}
</style>
