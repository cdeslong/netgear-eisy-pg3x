'use strict';
const snmp = require('net-snmp');
const BASE = '1.3.6.1.2.1.105.1.1.1';
const ADMIN = `${BASE}.3`;
const DETECT = `${BASE}.6`;
function validPort(port) { if (!Number.isInteger(port) || port < 1 || port > 48) throw new Error('Physical port must be 1..48'); }
function parseRow(oid, base) {
  if (!oid.startsWith(base + '.')) return null;
  const suffix = oid.slice(base.length + 1).split('.').map(Number);
  return suffix.length === 2 && suffix.every(Number.isInteger) ? {group:suffix[0],index:suffix[1]} : null;
}
class PoeSnmp {
 constructor({host, community, timeout=3000, retries=1, portMap={}}) {
  if (!host || !community) throw new Error('host and community required');
  this.session=snmp.createSession(host,community,{version:snmp.Version2c,timeout,retries});
  this.portMap=portMap;
 }
 close(){this.session.close();}
 get(oid){return new Promise((resolve,reject)=>this.session.get([oid],(err,vars)=>{
  if(err)return reject(err); const v=vars?.[0];
  if(!v || snmp.isVarbindError(v))return reject(new Error(v ? snmp.varbindError(v) : 'Empty response'));
  resolve(Number(v.value));
 }));}
 walk(base){return new Promise((resolve,reject)=>{
  const rows=[];
  this.session.subtree(base,20,vars=>{for(const v of vars){if(snmp.isVarbindError(v))continue;const key=parseRow(v.oid,base);if(key)rows.push({...key,value:Number(v.value),oid:v.oid});}},err=>err?reject(err):resolve(rows));
 });}
 async discover(){const [admin,detection]=await Promise.all([this.walk(ADMIN),this.walk(DETECT)]);
  return admin.map(a=>({...a, detection:detection.find(d=>d.group===a.group&&d.index===a.index)?.value??null}));}
 oid(port,column=ADMIN){validPort(port);const m=this.portMap[String(port)];
  if(!m || !Number.isInteger(m.group)||!Number.isInteger(m.index)||m.group<1||m.index<1)throw new Error(`Port ${port} has no verified mapping`);
  return `${column}.${m.group}.${m.index}`;
 }
 async read(port){const [admin,detection]=await Promise.all([this.get(this.oid(port)),this.get(this.oid(port,DETECT))]);return {port,enabled:admin===1,admin,detection};}
 async set(port,enabled,{allowWrite=false}={}){
  if(!allowWrite)throw new Error('Write disabled. Set allowWrite explicitly after verification.');
  const oid=this.oid(port);const value=enabled?1:2;
  await new Promise((resolve,reject)=>this.session.set([{oid,type:snmp.ObjectType.Integer,value}],(err,vars)=>{
   if(err)return reject(err);if(!vars?.[0]||snmp.isVarbindError(vars[0]))return reject(new Error(vars?.[0]?snmp.varbindError(vars[0]):'No SET response'));resolve();
  }));
  const state=await this.read(port);
  if(state.admin!==value)throw new Error(`Readback mismatch: expected ${value}, received ${state.admin}`);
  return state;
 }
}
module.exports={PoeSnmp,ADMIN,DETECT,parseRow};
