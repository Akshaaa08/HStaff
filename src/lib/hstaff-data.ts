import { Sparkles, CookingPot, Wrench, Zap, Hammer, Paintbrush, Utensils, Shield, Car, Truck, Package, HandHelping, AirVent, WashingMachine, Flame } from 'lucide-react';
import sunitaPhoto from '@/assets/sunita.jpg';
import rahulPhoto from '@/assets/rahul.jpg';

export const services = [
  { name:'Cleaning', full:'Housekeeping / Cleaner', icon:Sparkles, tasks:['Regular Cleaning','Deep Cleaning','Kitchen','Bathroom'], rate:250 },
  { name:'Cooking', full:'Cook / Kitchen Staff', icon:CookingPot, tasks:['Daily Meals','Meal Preparation','Party Cooking'], rate:300 },
  { name:'Plumbing', full:'Plumber', icon:Wrench, tasks:['Leak Repair','Tap Installation','Drain Cleaning'], rate:350 },
  { name:'Electrical', full:'Electrician', icon:Zap, tasks:['Wiring','Switch Repair','Appliance Installation'], rate:300 },
  { name:'Carpentry', full:'Carpenter', icon:Hammer, tasks:['Furniture Repair','Assembly','Door Repair'], rate:350 },
  { name:'Painting', full:'Painter', icon:Paintbrush, tasks:['Wall Painting','Touch-ups','Waterproofing'], rate:300 },
  { name:'Service Staff', full:'Waiter / Service Staff', icon:Utensils, tasks:['Event Service','Table Service'], rate:200 },
  { name:'Security', full:'Security Guard', icon:Shield, tasks:['Event Security','Property Security'], rate:250 },
  { name:'Driver', full:'Driver', icon:Car, tasks:['Local Trip','Outstation','Daily Driver'], rate:250 },
  { name:'Delivery', full:'Delivery / Logistics Worker', icon:Truck, tasks:['Parcel Delivery','Local Logistics'], rate:200 },
  { name:'Warehouse', full:'Warehouse Worker', icon:Package, tasks:['Packing','Sorting','Loading'], rate:200 },
  { name:'General Help', full:'General Helper / Labourer', icon:HandHelping, tasks:['Moving Help','General Labour'], rate:200 },
  { name:'AC Service', full:'AC / Refrigeration Technician', icon:AirVent, tasks:['AC Service','AC Repair','Refrigerator Repair'], rate:400 },
  { name:'Appliance Repair', full:'Appliance Repair Technician', icon:WashingMachine, tasks:['Washing Machine','Refrigerator','Small Appliances'], rate:350 },
  { name:'Welding', full:'Welder / Fabricator', icon:Flame, tasks:['Metal Repair','Fabrication','Gate Repair'], rate:400 },
];
export type Service = typeof services[number];
export const professionals = [
  { id:'sunita', name:'Sunita Patil', photo:sunitaPhoto, rating:4.9, jobs:184, experience:6, distance:1.2, rate:250, title:'Cleaning specialist', skills:['Deep cleaning','Housekeeping','Kitchen care'], bio:'A little care makes a house feel like home. I help families keep their homes fresh, comfortable and beautifully clean. Serving homes in Pune for over 6 years.', languages:'Marathi, Hindi, English', equipment:'Cleaning kit, vacuum cleaner, eco-friendly supplies', ontime:'98%', available:true },
  { id:'rahul', name:'Rahul Shinde', photo:rahulPhoto, rating:4.8, jobs:216, experience:8, distance:1.8, rate:300, title:'Skilled service professional', skills:['Repairs','Maintenance','Appliance care'], bio:'Experienced, careful and always happy to help. I believe in doing the job right, with clear communication and respect for your home.', languages:'Marathi, Hindi', equipment:'Complete tool kit and safety equipment', ontime:'97%', available:true },
];
export type Professional = typeof professionals[number];
export type BookingStatus = 'DRAFT'|'REQUESTED'|'ACCEPTED'|'CONFIRMED'|'EN_ROUTE'|'ARRIVED'|'IN_PROGRESS'|'COMPLETED_PENDING_PAYMENT'|'PAYMENT_PENDING'|'PAYMENT_COMPLETED'|'CLOSED'|'DECLINED'|'EXPIRED'|'CANCELLED'|'DISPUTED';
export type Booking = { id:string; service:string; professionalId:string; mode:'Instant'|'Scheduled'; date:string; time:string; duration:number; task:string; materials:string; notes:string; address:string; rate:number; status:BookingStatus; startedAt?:number; rating?:number; review?:string; };
export const statusLabels: Record<BookingStatus,string> = { DRAFT:'Draft', REQUESTED:'Request sent', ACCEPTED:'Accepted', CONFIRMED:'Confirmed', EN_ROUTE:'On the way', ARRIVED:'Arrived', IN_PROGRESS:'In progress', COMPLETED_PENDING_PAYMENT:'Service complete', PAYMENT_PENDING:'Payment pending', PAYMENT_COMPLETED:'Paid', CLOSED:'Completed', DECLINED:'Declined', EXPIRED:'No response', CANCELLED:'Cancelled', DISPUTED:'Issue reported' };
export const startCode='482713';
export const endCode='724819';
export const initialAddress='Flat 402, Green Park, Baner, Pune';
export const cities=['Pune','Mumbai','Ahilyanagar','Chhatrapati Sambhajinagar','Nashik'];
export const rupees=(n:number)=>`₹${n.toLocaleString('en-IN')}`;
export const fee=50;
export const allowedTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
  DRAFT:['REQUESTED'], REQUESTED:['ACCEPTED','DECLINED','EXPIRED','CANCELLED'], ACCEPTED:['CONFIRMED','CANCELLED'], CONFIRMED:['EN_ROUTE','CANCELLED'], EN_ROUTE:['ARRIVED','CANCELLED'], ARRIVED:['IN_PROGRESS','CANCELLED'], IN_PROGRESS:['COMPLETED_PENDING_PAYMENT','DISPUTED'], COMPLETED_PENDING_PAYMENT:['PAYMENT_PENDING'], PAYMENT_PENDING:['PAYMENT_COMPLETED'], PAYMENT_COMPLETED:['CLOSED'],
};
export function canTransition(from:BookingStatus,to:BookingStatus) { return allowedTransitions[from]?.includes(to) ?? false; }