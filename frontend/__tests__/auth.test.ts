import {describe,it,expect} from '@jest/globals';
import {loginError,clientSignupError,proSignupError,upiOk,type ClientSignup,type ProSignup} from '../src/lib/auth';
const c:ClientSignup={name:'Akshaa',phone:'9876543210',phoneVerified:true,email:'a@b.com',google:false,address:'',locationGranted:true,contactAccess:true,terms:true};
const p:ProSignup={name:'Rahul',phone:'9876543210',phoneVerified:true,email:'r@b.com',age:25,photo:true,document:true,upi:'rahul@okaxis',terms:true};
describe('H-Staff sign-up rules',()=>{
 it('login needs email and password',()=>{expect(loginError('bad','12345678')).not.toBe('');expect(loginError('a@b.com','12345678')).toBe('')});
 it('client needs verified phone',()=>expect(clientSignupError({...c,phoneVerified:false})).not.toBe(''));
 it('client can use Google instead of email',()=>expect(clientSignupError({...c,email:'',google:true})).toBe(''));
 it('client can skip location and address at signup',()=>{expect(clientSignupError({...c,locationGranted:false,address:''})).toBe('');expect(clientSignupError({...c,locationGranted:false,address:'24 Green Park, Baner'})).toBe('')});
 it('client must allow call and message access',()=>expect(clientSignupError({...c,contactAccess:false})).not.toBe(''));
 it('both personas must accept terms',()=>{expect(clientSignupError({...c,terms:false})).not.toBe('');expect(proSignupError({...p,terms:false})).not.toBe('')});
 it('helper must be 18 or older',()=>{expect(proSignupError({...p,age:17})).not.toBe('');expect(proSignupError({...p,age:18})).toBe('')});
 it('helper needs face photo and document',()=>{expect(proSignupError({...p,photo:false})).not.toBe('');expect(proSignupError({...p,document:false})).not.toBe('')});
 it('helper needs a valid UPI ID',()=>{expect(upiOk('rahul@okaxis')).toBe(true);expect(upiOk('rahul')).toBe(false)});
});
