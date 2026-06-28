<template>
  <header
    class="hidden md:block bg-default/75 backdrop-blur border-b border-default top-0 z-50 relative py-4 md:py-6"
  >
    <div
      class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-full relative"
    >
      <ULink
        to="https://jlopes.eu"
        aria-label="Go to homepage - jlopes.eu"
        class="md:absolute md:left-5"
      >
        <SiteLogo
          class="size-11 text-primary hover:text-secondary transition-colors"
        />
      </ULink>

      <nav
        aria-label="Main navigation"
        class="hidden md:flex items-center gap-5 text-2xl text-base-400"
      >
        <ULink
          raw
          to="https://jlopes.eu/"
          class="text-primary transition-colors border-b-2 border-transparent hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          Home
        </ULink>
        <ULink
          raw
          to="https://jlopes.eu/about/"
          class="text-secondary hover:text-secondary transition-colors border-b-2 border-transparent hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          About
        </ULink>
        <ULink
          raw
          to="https://jlopes.eu/work/"
          class="text-warning transition-colors border-b-2 border-transparent hover:border-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          Work
        </ULink>
        <ULink
          raw
          to="https://jlopes.eu/blog/"
          class="text-success transition-colors border-b-2 border-transparent hover:border-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          Blog
        </ULink>
        <ULink
          raw
          to="https://jlopes.eu/tools/"
          class="text-error transition-colors border-b-2 border-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-current="page"
        >
          Tools
        </ULink>
      </nav>
    </div>
  </header>
</template>
