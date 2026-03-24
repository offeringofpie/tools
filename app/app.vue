<template>
  <Hello />
</template>

<style>
:root {
  --background: hsl(0, 0%, 0%);
  --primary: hsl(180, 100%, 39%);
}
html,
body {
  margin: 0;
  padding: 0;
  height: 100vh;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background-color: var(--background);
  color: var(--primary);
}

#__nuxt {
  height: 100%;
}
</style>
