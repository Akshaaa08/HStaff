import {useState,type ReactNode} from 'react';
import {ArrowRight,BriefcaseBusiness,Camera,Check,FileUp,Home,LockKeyhole,Mail,MapPin,MessageCircle,Phone,ShieldCheck,Sparkles,Star,User,Wallet} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {AUTH_OTP,professionals,services} from '@/lib/hstaff-domain';
import {clientSignupError,loginError,phoneOk,proSignupError,type Persona} from '@/lib/hstaff-auth';
import {Choice,HStaffLogo,ScreenTop} from './primitives';

export type AuthResult={role:Persona;name:string;phone:string;email:string;city?:string};
type View='landing'|'login'|'signup-customer'|'signup-professional';

const TERMS:Record<Persona,string[]>={
 customer:['Treat professionals with respect and provide a safe workplace.','Pay the price shown — professional charge plus the H-Staff service fee.','Share Start and End codes only when the professional is with you.','Cancellations after a professional is en route may carry a fee.','Contact professionals only through H-Staff calls and messages.'],
 professional:['You are 18+ and all identity details and documents are genuine.','H-Staff may verify your photo and documents before you receive jobs.','Arrive on time, verify the Start code and finish with the End code.','Earnings are paid to your UPI ID after each completed job.','Never ask customers for payment outside H-Staff or share their details.'],
};

import {api} from '@/lib/api-client';

function Field({label,icon,children}:{label:string;icon:ReactNode;children:ReactNode}){return <><label className="field-label">{label}</label><div className="search-field auth-field">{icon}{children}</div></>}

function PhoneVerify({phone,setPhone,verified,setVerified,role='customer',name}:{phone:string;setPhone:(v:string)=>void;verified:boolean;setVerified:(v:boolean)=>void;role?:Persona;name?:string}){
 const [sent,setSent]=useState(false);const [code,setCode]=useState('');const [err,setErr]=useState('');const [loading,setLoading]=useState(false);const [serverHint,setServerHint]=useState('');
 const handleSend=async()=>{
  if(!phoneOk(phone)){setErr('Enter a valid 10-digit mobile number.');return}
  setErr('');setLoading(true);
  try{
   const res=await api.requestOtp(phone,role);
   setSent(true);
   if(res?.debug_code)setServerHint(`Code: ${res.debug_code}`);
   else setServerHint('Code sent (check server console in dev)');
  }catch{
   setSent(true);
   setServerHint('Connected to demo fallback');
  }finally{setLoading(false)}
 };
 const handleVerify=async()=>{
  if(!code||code.length<6){setErr('Enter the 6-digit OTP.');return}
  setErr('');setLoading(true);
  try{
   await api.verifyOtp({phone,otp:code,role,name});
   setVerified(true);setErr('');
  }catch(e:unknown){
   if(code===AUTH_OTP){setVerified(true);setErr('')}
   else setErr((e as {message?:string})?.message||'That code doesn’t match.');
  }finally{setLoading(false)}
 };
 return <><Field label="Mobile number" icon={<strong>+91</strong>}><input type="tel" inputMode="numeric" aria-label="Mobile number" placeholder="98765 43210" maxLength={10} value={phone} disabled={verified} onChange={e=>{setPhone(e.target.value.replace(/\D/g,''));setSent(false);setServerHint('')}}/>{verified?<span className="verified"><Check/>Verified</span>:<Button variant="quiet" disabled={loading} onClick={handleSend}>{loading?'Sending...':sent?'Resend':'Send OTP'}</Button>}</Field>
 {sent&&!verified&&<div className="otp-inline"><input className="field" aria-label="Mobile OTP" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><Button disabled={loading} onClick={handleVerify}>{loading?'...':'Verify'}</Button></div>}
 {sent&&!verified&&<p className="subtle mt-2">Demo code: {AUTH_OTP} {serverHint?`· ${serverHint}`:''}</p>}{err&&<p className="error-text" role="alert">{err}</p>}</>
}

function Terms({persona,accepted,setAccepted}:{persona:Persona;accepted:boolean;setAccepted:(v:boolean)=>void}){
 const [open,setOpen]=useState(false);
 return <div className="terms-box"><Button variant="quiet" onClick={()=>setOpen(!open)}>{persona==='customer'?'Customer':'Professional'} Terms & Conditions<ArrowRight/></Button>{open&&<ol>{TERMS[persona].map(t=><li key={t}>{t}</li>)}</ol>}<label className="check-row"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I have read and agree to the {persona==='customer'?'Customer':'Professional'} Terms & Conditions and Privacy Policy.</span></label></div>
}

function Landing({go}:{go:(v:View)=>void}){
 return <div className="landing">
  <div className="landing-blob one"/><div className="landing-blob two"/>
  <div className="landing-top"><HStaffLogo/><Button variant="quiet" onClick={()=>go('login')}>Log in</Button></div>
  <p className="landing-pill"><Sparkles/>Verified help across Maharashtra</p>
  <h1 className="landing-title">Good people.<br/><span>Great help.</span><br/>Right next door.</h1>
  <p className="subtle landing-sub">Book trusted local professionals in minutes — or earn on your own terms.</p>
  <div className="landing-collage">
   <img src={professionals[0].image} alt="Sunita, a verified cleaning professional" width={150} height={190}/>
   <img src={professionals[1].image} alt="Rahul, a verified electrician" width={150} height={190}/>
   <span className="float-badge a"><Star/>4.9 rated</span><span className="float-badge b"><ShieldCheck/>ID verified</span><span className="float-badge c">₹250/hr · no hidden fees</span>
  </div>
  <div className="marquee" aria-hidden="true"><div>{[...services,...services].map((s,i)=><span key={i}><s.icon/>{s.name}</span>)}</div></div>
  <div className="landing-ctas">
   <Button className="full-button" onClick={()=>go('signup-customer')}><Home/>Sign up to hire help<ArrowRight/></Button>
   <Button variant="outline" className="full-button rounded-full" onClick={()=>go('signup-professional')}><BriefcaseBusiness/>Sign up to work as a helper</Button>
   <p className="subtle centered mt-4">Already have an account? <Button variant="quiet" className="inline-flex" onClick={()=>go('login')}>Log in</Button></p>
  </div>
 </div>
}

export function AuthFlow({onDone}:{onDone:(r:AuthResult)=>void}){
 const [view,setView]=useState<View>('landing');const [err,setErr]=useState('');
 const [role,setRole]=useState<Persona>('customer');const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');
 const [phone,setPhone]=useState('');const [verified,setVerified]=useState(false);const [terms,setTerms]=useState(false);
 const [google,setGoogle]=useState(false);const [loc,setLoc]=useState<'idle'|'granted'|'denied'>('idle');const [address,setAddress]=useState('');const [contact,setContact]=useState(false);
 const [age,setAge]=useState('');const [photo,setPhoto]=useState('');const [doc,setDoc]=useState('');const [upi,setUpi]=useState('');
 const go=(v:View)=>{setView(v);setErr('');setTerms(false);setVerified(false);if(v==='signup-customer')setRole('customer');if(v==='signup-professional')setRole('professional')};
 const top=(t:string)=><ScreenTop title={t} onBack={()=>go('landing')}/>;
 const requestLocation=()=>{if(!navigator.geolocation){setLoc('denied');return}navigator.geolocation.getCurrentPosition(()=>setLoc('granted'),()=>setLoc('denied'),{timeout:8000})};
 const submit=()=>{let e='';
  if(view==='login'){e=loginError(email,password)||(!verified?'Please verify your mobile number.':'');if(!e)onDone({role,name:role==='customer'?'Akshaa':'Rahul Shinde',phone,email})}
  if(view==='signup-customer'){e=clientSignupError({name,phone,phoneVerified:verified,email,google,address,locationGranted:loc==='granted',contactAccess:contact,terms});if(!e)onDone({role:'customer',name,phone,email:google?'google account':email})}
  if(view==='signup-professional'){e=proSignupError({name,phone,phoneVerified:verified,email,age:Number(age),photo:!!photo,document:!!doc,upi,terms});if(!e)onDone({role:'professional',name,phone,email})}
  setErr(e)};
 const err_=err&&<p className="error-text" role="alert">{err}</p>;
 if(view==='landing')return <Landing go={go}/>;
 if(view==='login')return <div className="page">{top('Log in')}<h1 className="screen-title">Welcome back.</h1><p className="subtle">Log in with email, then confirm your mobile.</p>
  <div className="stack"><Choice title="I hire help" icon={<Home/>} selected={role==='customer'} onClick={()=>setRole('customer')}/><Choice title="I work as a helper" icon={<BriefcaseBusiness/>} selected={role==='professional'} onClick={()=>setRole('professional')}/></div>
  <Field label="Email" icon={<Mail/>}><input type="email" aria-label="Email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
  <Field label="Password" icon={<LockKeyhole/>}><input type="password" aria-label="Password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/></Field>
  <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified}/>
  {err_}<Button className="full-button" onClick={submit}>Log in<ArrowRight/></Button><p className="subtle centered mt-4">New here? <Button variant="quiet" className="inline-flex" onClick={()=>go('signup-customer')}>Create an account</Button></p></div>;
 if(view==='signup-customer')return <div className="page">{top('Create your account')}<h1 className="screen-title">Help is a tap away.</h1><p className="subtle">A few details and you’re ready to book.</p>
  <Field label="Full name" icon={<User/>}><input aria-label="Full name" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)}/></Field>
  <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified}/>
  {google?<p className="verified mt-4"><Check/>Google account connected</p>:<><Field label="Email" icon={<Mail/>}><input type="email" aria-label="Email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field><div className="or-row"><span>or</span></div><Button variant="outline" className="full-button rounded-full google-btn" onClick={()=>setGoogle(true)}><span className="g-mark">G</span>Sign up with Google</Button></>}
  <label className="field-label">Location</label>
  {loc==='granted'?<p className="verified"><MapPin/>Location access allowed</p>:<Button variant="outline" className="full-button rounded-full !mt-0" onClick={requestLocation}><MapPin/>Allow location access</Button>}
  {loc==='denied'&&<><p className="subtle mt-2">No location access — please enter your address.</p><textarea className="field mt-2" aria-label="Address" rows={2} placeholder="House no., street, area, city" value={address} onChange={e=>setAddress(e.target.value)}/></>}
  {loc==='idle'&&<Button variant="quiet" className="mt-2" onClick={()=>setLoc('denied')}>Enter address manually instead</Button>}
  <label className="check-row perm"><input type="checkbox" checked={contact} onChange={e=>setContact(e.target.checked)}/><span><Phone size={14} className="inline"/> <MessageCircle size={14} className="inline"/> Allow call and message access so your professional can reach you through H-Staff.</span></label>
  <Terms persona="customer" accepted={terms} setAccepted={setTerms}/>{err_}<Button className="full-button" onClick={submit}>Create account<ArrowRight/></Button></div>;
 return <div className="page">{top('Join as a helper')}<h1 className="screen-title">Your skills. Your schedule.</h1><p className="subtle">We verify every helper to keep everyone safe. Review takes up to 24 hours.</p>
  <Field label="Full name (as on ID)" icon={<User/>}><input aria-label="Full name" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/></Field>
  <PhoneVerify phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified}/>
  <Field label="Email" icon={<Mail/>}><input type="email" aria-label="Email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
  <Field label="Age" icon={<User/>}><input type="number" inputMode="numeric" aria-label="Age" placeholder="18 or older" value={age} onChange={e=>setAge(e.target.value)}/></Field>
  <label className="field-label">Your photo</label>
  <label className="upload-card">{photo?<img src={photo} alt="Your selfie preview" className="selfie"/>:<Camera/>}<span><strong>{photo?'Retake photo':'Take a selfie'}</strong><small>Face the light, remove sunglasses or masks, keep your whole face visible.</small></span><input type="file" accept="image/*" capture="user" className="sr-only" aria-label="Take photo" onChange={e=>{const f=e.target.files?.[0];if(f)setPhoto(URL.createObjectURL(f))}}/></label>
  <label className="field-label">Verification document</label>
  <label className="upload-card"><FileUp/><span><strong>{doc||'Upload ID document'}</strong><small>Aadhaar, PAN, Voter ID or Driving Licence · JPG, PNG or PDF</small></span><input type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Upload document" onChange={e=>setDoc(e.target.files?.[0]?.name??'')}/></label>
  <Field label="UPI ID for payouts" icon={<Wallet/>}><input aria-label="UPI ID" placeholder="name@okbank" value={upi} onChange={e=>setUpi(e.target.value)}/></Field>
  <Terms persona="professional" accepted={terms} setAccepted={setTerms}/>{err_}<Button className="full-button" onClick={submit}>Submit for verification<ArrowRight/></Button></div>;
}
