import {createFileRoute} from '@tanstack/react-router';
import {HStaffApp} from '@/components/hstaff/app';
export const Route=createFileRoute('/')({
 head:()=>({meta:[
 {title:'H-Staff — Your everyday helping hand'},
 {name:'description',content:'Choose trusted local professionals for household tasks and repairs. Book, track and pay with the H-Staff mobile prototype.'},
 {property:'og:title',content:'H-Staff — Your everyday helping hand'},
 {property:'og:description',content:'Good people. Great help. Discover a mobile-first marketplace for everyday services in your neighbourhood.'},
 {property:'og:type',content:'website'},
 {name:'twitter:card',content:'summary_large_image'},
 ]}),component:HStaffApp,
});
