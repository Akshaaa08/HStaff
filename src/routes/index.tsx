import { createFileRoute } from "@tanstack/react-router";
import HStaffApp from '@/components/hstaff-app';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'H-Staff — Your everyday helping hand' },
    { name: 'description', content: 'Choose trusted local professionals for cleaning, cooking, repairs and more. Explore the H-Staff customer and professional prototype.' },
    { property: 'og:title', content: 'H-Staff — Your everyday helping hand' },
    { property: 'og:description', content: 'The right person for the job, when you need them. A trusted local-services marketplace.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: HStaffApp,
});
