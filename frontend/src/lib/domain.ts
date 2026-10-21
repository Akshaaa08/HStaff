export const services = [
 {name:'Cleaning',full:'Housekeeping / Cleaner',tone:'peach'}, {name:'Cooking',full:'Cook / Kitchen Staff',tone:'yellow'}, {name:'Plumbing',full:'Plumber',tone:'mint'}, {name:'Electrical',full:'Electrician',tone:'lavender'}, {name:'Carpentry',full:'Carpenter',tone:'pink'}, {name:'General Help',full:'General Helper / Labourer',tone:'mint'}, {name:'Service Staff',full:'Waiter / Service Staff',tone:'peach'}, {name:'Nurse',full:'Patient care / Bathing / Hygiene / Wound nursing',tone:'lavender'}, {name:'Driver',full:'Driver',tone:'yellow'}, {name:'Delivery',full:'Delivery / Logistics Worker',tone:'pink'}, {name:'Gardening',full:'Gardener / Plant care',tone:'mint'}, {name:'Beauty',full:'Waxing / Threading / Facial / Cleanup / Massage / Manicure / Pedicure',tone:'peach'}, {name:'AC Service',full:'AC / Refrigeration Technician',tone:'lavender'}, {name:'Appliance Repair',full:'Appliance Repair Technician',tone:'yellow'}, {name:'Welding',full:'Welder / Fabricator',tone:'pink'},
];

export interface Professional {
  id: string;
  name: string;
  rating: number;
  jobs: number;
  years: number;
  distance: number;
  rate: number;
  skills: string[];
  bio: string;
  equipment: string;
  languages: string;
  ontime: string;
}

export const professionals: Professional[] = [
 {id:'sunita',name:'Sunita Patil',rating:4.9,jobs:184,years:8,distance:1.2,rate:250,skills:['Regular cleaning','Deep cleaning','Kitchen care'],bio:'A little care makes a house feel like home. I\u2019ve been helping Pune families keep their spaces fresh and organised for eight years.',equipment:'Cleaning kit, brushes and eco-friendly supplies',languages:'Marathi, Hindi',ontime:'98%'},
 {id:'rahul',name:'Rahul Shinde',rating:4.8,jobs:156,years:6,distance:1.8,rate:300,skills:['Wiring','Repairs','Home maintenance'],bio:'Reliable help for the little things and the big fixes. I take pride in careful work, a tidy space and arriving on time.',equipment:'Professional toolkit and safety equipment',languages:'Marathi, Hindi, English',ontime:'97%'},
];

export type BookingStatus = 'DRAFT'|'OPEN'|'REQUESTED'|'ACCEPTED'|'CONFIRMED'|'EN_ROUTE'|'ARRIVED'|'IN_PROGRESS'|'COMPLETED_PENDING_PAYMENT'|'COMPLETION_VERIFIED'|'PAYMENT_PENDING'|'PAYMENT_COMPLETED'|'CLOSED'|'DECLINED'|'EXPIRED'|'CANCELLED'|'DISPUTED'|'FAILED';
export type Booking = {id:string;service:string;professionalId:string;mode:'Instant'|'Scheduled';date:string;time:string;hours:number;task:string;materials:string;notes:string;address:string;status:BookingStatus;startedAt?:number;rating?:number;review?:string;paymentMethod?:string};
const transitions:Record<BookingStatus,BookingStatus[]> = {
 DRAFT:['OPEN','CANCELLED'],OPEN:['REQUESTED','CANCELLED'],REQUESTED:['ACCEPTED','DECLINED','EXPIRED','CANCELLED'],ACCEPTED:['CONFIRMED','CANCELLED'],CONFIRMED:['EN_ROUTE','CANCELLED'],EN_ROUTE:['ARRIVED','CANCELLED'],ARRIVED:['IN_PROGRESS','DISPUTED'],IN_PROGRESS:['COMPLETED_PENDING_PAYMENT','DISPUTED'],COMPLETED_PENDING_PAYMENT:['COMPLETION_VERIFIED','DISPUTED'],COMPLETION_VERIFIED:['PAYMENT_PENDING','DISPUTED'],PAYMENT_PENDING:['PAYMENT_COMPLETED','FAILED'],FAILED:['PAYMENT_PENDING'],PAYMENT_COMPLETED:['CLOSED'],CLOSED:[],DECLINED:['OPEN','CANCELLED'],EXPIRED:['OPEN','CANCELLED'],CANCELLED:[],DISPUTED:[],
};
export function canTransition(from:BookingStatus,to:BookingStatus){return transitions[from].includes(to)}
export function moveBooking(b:Booking,status:BookingStatus):Booking { if(!canTransition(b.status,status)) return b;return {...b,status,...(status==='IN_PROGRESS'?{startedAt:Date.now()}: {})} }
export function priceFor(rate:number,hours:number){const charge=rate*hours;return {charge,fee:50,total:charge+50}}
export const START_OTP='482713';export const END_OTP='724819';export const AUTH_OTP='123456';
export function canTrack(s:BookingStatus){return s==='EN_ROUTE'||s==='ARRIVED'}
export function visibleOtp(s:BookingStatus){return s==='ARRIVED'?START_OTP:s==='COMPLETED_PENDING_PAYMENT'?END_OTP:null}
export function verifyCode(s:BookingStatus,code:string){return s==='ARRIVED'?code===START_OTP:s==='COMPLETED_PENDING_PAYMENT'?code===END_OTP:false}
export function canFallback(s:BookingStatus){return s==='DECLINED'||s==='EXPIRED'}
export function professionalFor(id:string,pool?:Professional[]):Professional{const src=pool&&pool.length>0?pool:professionals;return src.find(p=>p.id===id)??professionals[0]}
/** Indian digit grouping (12,34,567) without relying on Intl being present on the device. */
export const money=(amount:number)=>{const n=String(Math.round(amount));const last3=n.slice(-3);const rest=n.slice(0,-3);return '\u20b9'+(rest?rest.replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+last3:last3)};
/** 'hh:mm am' – matches toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}). */
export const clock=(ts:number)=>{const d=new Date(ts);const h=d.getHours();const hh=String(h%12||12).padStart(2,'0');return `${hh}:${String(d.getMinutes()).padStart(2,'0')} ${h<12?'am':'pm'}`};
export const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export const cities=['Pune','Mumbai','Ahilyanagar','Chhatrapati Sambhajinagar','Nashik'];
export const statusLabel=(s:BookingStatus)=>({EN_ROUTE:'On the way',ARRIVED:'Arrived',IN_PROGRESS:'In progress',CLOSED:'Completed',PAYMENT_COMPLETED:'Paid',REQUESTED:'Finding your professional',COMPLETED_PENDING_PAYMENT:'Completion requested',COMPLETION_VERIFIED:'Completion verified',CONFIRMED:'Confirmed',ACCEPTED:'Accepted',DRAFT:'Draft',OPEN:'Ready to request',PAYMENT_PENDING:'Payment pending',DECLINED:'Declined',EXPIRED:'No response',CANCELLED:'Cancelled',DISPUTED:'Issue reported',FAILED:'Payment failed'}[s]);
export const serviceTasks:Record<string,string[]>={Cleaning:['Regular Cleaning','Deep Cleaning','Kitchen','Bathroom'],Beauty:['Waxing','Threading','Facial','Cleanup','Massage','Manicure','Pedicure','Other beauty services'],Nurse:['Bathing assistance','Patient hygiene','Wound nursing','Daily patient care'],Gardening:['Plant care','Pruning','Lawn care','Garden cleanup'],Cooking:['Meal preparation','Kitchen prep','Weekly meal prep'],Plumbing:['Leak repair','Drain cleaning','Tap installation'],Electrical:['Wiring','Switch repair','Lighting installation'],Carpentry:['Furniture repair','Assembly','Door repair'],'General Help':['Moving assistance','Household tasks','Lifting help'],'Service Staff':['Table service','Event setup','Serving food'],Driver:['Local trip','Outstation trip'],Delivery:['Parcel delivery','Pickup'], 'AC Service':['AC cleaning','AC repair','Refrigerator service'],'Appliance Repair':['Washing machine','Refrigerator','Small appliance'],Welding:['Fabrication','Metal repair']};
export const tasksFor=(service:string)=>serviceTasks[service]??[`${service} service`];
export const toggleTask=(tasks:string[],task:string)=>tasks.includes(task)?tasks.filter(t=>t!==task):[...tasks,task];
export const bookingAddressOk=(address:string)=>address.trim().length>=5;
export const assignedProfessional=(service:string)=>service==='Electrical'?'rahul':'sunita';
export function roleCanTransition(role:'customer'|'professional',from:BookingStatus,to:BookingStatus){if(!canTransition(from,to))return false;const workerOnly:BookingStatus[]=['ACCEPTED','DECLINED','CONFIRMED','EN_ROUTE','ARRIVED','IN_PROGRESS','COMPLETED_PENDING_PAYMENT','COMPLETION_VERIFIED'];const customerOnly:BookingStatus[]=['OPEN','REQUESTED','PAYMENT_PENDING','PAYMENT_COMPLETED','FAILED','CLOSED'];return workerOnly.includes(to)?role==='professional':customerOnly.includes(to)?role==='customer':true;}
export function workerVerifyBooking(b:Booking,role:'customer'|'professional',code:string){if(role!=='professional'||!verifyCode(b.status,code))return b;return moveBooking(b,b.status==='ARRIVED'?'IN_PROGRESS':'COMPLETION_VERIFIED');}

/**
 * Maps service display names to backend category IDs.
 * IDs correspond to the seed data in the NestJS backend.
 */
export const serviceCategoryMap: Record<string, number> = {
  'Cleaning': 1, 'Cooking': 2, 'Plumbing': 3, 'Electrical': 4,
  'Carpentry': 5, 'General Help': 6, 'Service Staff': 7, 'Nurse': 8,
  'Driver': 9, 'Delivery': 10, 'Gardening': 11, 'Beauty': 12,
  'AC Service': 13, 'Appliance Repair': 14, 'Welding': 15,
};

/**
 * Converts a backend Worker response object into the Professional shape
 * the UI consumes. This is the single point of mapping between the
 * NestJS backend model and the React Native frontend model.
 */
export function workerToProfessional(w: any): Professional {
  return {
    id: w.id ?? w.workerId ?? '',
    name: w.user?.phone
      ? `Worker ${w.user.phone.slice(-4)}`
      : w.name ?? 'Professional',
    rating: w.avgRating ?? 4.5,
    jobs: w.completedJobs ?? 0,
    years: w.experienceYears ?? 1,
    distance: w.distanceKm ?? w.distance ?? 2.0,
    rate: w.baseHourlyRate ?? 250,
    skills: Array.isArray(w.skills)
      ? w.skills.map((s: any) => (typeof s === 'string' ? s : s.name ?? ''))
      : [],
    bio: w.bio ?? 'Experienced professional ready to help.',
    equipment: w.equipment ?? 'Professional toolkit',
    languages: w.languages ?? 'Hindi, Marathi',
    ontime: w.ontimePercent ? `${w.ontimePercent}%` : '95%',
  };
}
