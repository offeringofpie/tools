<template>
  <header
    class="bg-default/75 backdrop-blur border-b border-default top-0 z-50 relative py-4 md:py-6"
  >
    <div
      class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-full"
    >
      <ULink
        to="https://jlopes.eu"
        aria-label="Go to homepage - jlopes.eu"
        class="md:absolute hidden md:block left-5"
      >
        <SiteLogo
          class="size-10 text-primary hover:text-secondary transition-colors"
        />
      </ULink>

      <nav
        aria-label="Main navigation"
        class="flex items-center gap-5 text-2xl text-base-400"
      >
        <ULink
          raw
          to="https://jlopes.eu"
          class="text-primary hover:text-secondary transition-colors border-0 border-b-2 border-transparent hover:border-secondary"
          >Home</ULink
        >
        <ULink
          raw
          to="https://jlopes.eu/about"
          class="text-secondary hover:text-secondary transition-colors border-0 border-b-2 border-transparent hover:border-secondary"
          >About</ULink
        >
        <ULink
          raw
          to="https://jlopes.eu/blog"
          class="text-success hover:text-secondary transition-colors border-0 border-b-2 border-transparent hover:border-secondary"
          >Blog</ULink
        >
        <ULink
          raw
          to="https://jlopes.eu/tools"
          class="text-warning transition-colors border-0 border-b-2 border-warning hover:border-warning"
          >Tools</ULink
        >
      </nav>
    </div>
  </header>
</template>
