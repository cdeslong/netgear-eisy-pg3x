const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseRow,PoeSnmp,ADMIN}=require('../src/snmp');
test('parses group and port index',()=>assert.deepEqual(parseRow(`${ADMIN}.1.10`,ADMIN),{group:1,index:10}));
test('rejects unrelated OID',()=>assert.equal(parseRow('1.2.3',ADMIN),null));
test('requires verified map',()=>{const c=Object.create(PoeSnmp.prototype);c.portMap={};assert.throws(()=>c.oid(10),/verified mapping/);});
test('generates mapped OID',()=>{const c=Object.create(PoeSnmp.prototype);c.portMap={'10':{group:1,index:10}};assert.equal(c.oid(10),`${ADMIN}.1.10`);});
