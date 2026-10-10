import { Brush, ChefHat, Zap, Wrench, Hammer, HandHelping, Utensils, Shield, Car, Truck, Package, Paintbrush, Wind, Refrigerator, Flame } from 'lucide-react';
import sunita from '@/assets/sunita.jpg';
import rahul from '@/assets/rahul.jpg';
export const services = [
 {name:'Cleaning',full:'Housekeeping / Cleaner',icon:Brush,tone:'peach'}, {name:'Cooking',full:'Cook / Kitchen Staff',icon:ChefHat,tone:'yellow'}, {name:'Plumbing',full:'Plumber',icon:Wrench,tone:'mint'}, {name:'Electrical',full:'Electrician',icon:Zap,tone:'lavender'}, {name:'Carpentry',full:'Carpenter',icon:Hammer,tone:'pink'}, {name:'General Help',full:'General Helper / Labourer',icon:HandHelping,tone:'mint'}, {name:'Service Staff',full:'Waiter / Service Staff',icon:Utensils,tone:'peach'}, {name:'Security',full:'Security Guard',icon:Shield,tone:'lavender'}, {name:'Driver',full:'Driver',icon:Car,tone:'yellow'}, {name:'Delivery',full:'Delivery / Logistics Worker',icon:Truck,tone:'pink'}, {name:'Warehouse',full:'Warehouse Worker',icon:Package,tone:'mint'}, {name:'Painting',full:'Painter',icon:Paintbrush,tone:'peach'}, {name:'AC Service',full:'AC / Refrigeration Technician',icon:Wind,tone:'lavender'}, {name:'Appliance Repair',full:'Appliance Repair Technician',icon:Refrigerator,tone:'yellow'}, {name:'Welding',full:'Welder / Fabricator',icon:Flame,tone:'pink'},
];
export const professionals = [
 {id:'sunita',name:'Sunita Patil',image:sunita,rating:4.9,jobs:184,years:8,distance:1.2,rate:250,skills:['Regular cleaning','Deep cleaning','Kitchen care'],bio:'A little care makes a house feel like home. I’ve been helping Pune families keep their spaces fresh and organised for eight years.',equipment:'Cleaning kit, brushes and eco-friendly supplies',languages:'Marathi, Hindi',ontime:'98%'},
 {id:'rahul',name:'Rahul Shinde',image:rahul,rating:4.8,jobs:156,years:6,distance:1.8,rate:300,skills:['Wiring','Repairs','Home maintenance'],bio:'Reliable help for the little things and the big fixes. I take pride in careful work, a tidy space and arriving on time.',equipment:'Professional toolkit and safety equipment',languages:'Marathi, Hindi, English',ontime:'97%'},
] as const;
export type Professional = typeof professionals[number];
export type BookingStatus = 'DRAFT'|'OPEN'|'REQUESTED'|'ACCEPTED'|'CONFIRMED'|'EN_ROUTE'|'ARRIVED'|'IN_PROGRESS'|'COMPLETED_PENDING_PAYMENT'|'PAYMENT_PENDING'|'PAYMENT_COMPLETED'|'CLOSED'|'DECLINED'|'EXPIRED'|'CANCELLED'|'DISPUTED'|'FAILED';
export type Booking = {id:string;service:string;professionalId:string;mode:'Instant'|'Scheduled';date:string;time:string;hours:number;task:string;materials:string;notes:string;address:string;status:BookingStatus;startedAt?:number;rating?:number;review?:string;paymentMethod?:string};
const transitions:Record<BookingStatus,BookingStatus[]> = {
 DRAFT:['OPEN','CANCELLED'],OPEN:['REQUESTED','CANCELLED'],REQUESTED:['ACCEPTED','DECLINED','EXPIRED','CANCELLED'],ACCEPTED:['CONFIRMED','CANCELLED'],CONFIRMED:['EN_ROUTE','CANCELLED'],EN_ROUTE:['ARRIVED','CANCELLED'],ARRIVED:['IN_PROGRESS','DISPUTED'],IN_PROGRESS:['COMPLETED_PENDING_PAYMENT','DISPUTED'],COMPLETED_PENDING_PAYMENT:['PAYMENT_PENDING','DISPUTED'],PAYMENT_PENDING:['PAYMENT_COMPLETED','FAILED'],FAILED:['PAYMENT_PENDING'],PAYMENT_COMPLETED:['CLOSED'],CLOSED:[],DECLINED:['OPEN','CANCELLED'],EXPIRED:['OPEN','CANCELLED'],CANCELLED:[],DISPUTED:['IN_PROGRESS','COMPLETED_PENDING_PAYMENT'],
};
export function canTransition(from:BookingStatus,to:BookingStatus){return transitions[from].includes(to)}
export function moveBooking(b:Booking,status:BookingStatus):Booking { if(!canTransition(b.status,status)) return b;return {...b,status,...(status==='IN_PROGRESS'?{startedAt:Date.now()}: {})} }
export function priceFor(rate:number,hours:number){const charge=rate*hours;return {charge,fee:50,total:charge+50}}
export const START_OTP='482713';export const END_OTP='724819';export const AUTH_OTP='123456';
export function canTrack(s:BookingStatus){return s==='EN_ROUTE'||s==='ARRIVED'}
export function visibleOtp(s:BookingStatus){return s==='ARRIVED'?START_OTP:s==='COMPLETED_PENDING_PAYMENT'?END_OTP:null}
export function verifyCode(s:BookingStatus,code:string){return s==='ARRIVED'?code===START_OTP:s==='COMPLETED_PENDING_PAYMENT'?code===END_OTP:false}
export function canFallback(s:BookingStatus){return s==='DECLINED'||s==='EXPIRED'}
export function professionalFor(id:string){return professionals.find(p=>p.id===id)??professionals[0]}
export const money=(amount:number)=>'₹'+amount.toLocaleString('en-IN');
export const cities=['Pune','Mumbai','Ahilyanagar','Chhatrapati Sambhajinagar','Nashik'];
export const statusLabel=(s:BookingStatus)=>({EN_ROUTE:'On the way',ARRIVED:'Arrived',IN_PROGRESS:'In progress',CLOSED:'Completed',PAYMENT_COMPLETED:'Paid',REQUESTED:'Awaiting response',COMPLETED_PENDING_PAYMENT:'Completion requested',CONFIRMED:'Confirmed',ACCEPTED:'Accepted',DRAFT:'Draft',OPEN:'Ready to request',PAYMENT_PENDING:'Payment pending',DECLINED:'Declined',EXPIRED:'No response',CANCELLED:'Cancelled',DISPUTED:'Issue reported',FAILED:'Payment failed'}[s]);
