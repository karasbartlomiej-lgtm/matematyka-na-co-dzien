const encoder=new TextEncoder()
const hex=bytes=>Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('')
const bytes=h=>Uint8Array.from(h.match(/../g),pair=>parseInt(pair,16))
async function profileKey(password,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits'])
 return crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:bytes(salt),iterations:210000},key,256)
}
export async function verifyProfile(profile,password){
 if([...password].length<1||[...password].length>4)return false
 const salt=profile.lock?.salt??hex(crypto.getRandomValues(new Uint8Array(16)))
 const digest=hex(await profileKey(password,salt))
 if(profile.lock)return digest===profile.lock.digest
 profile.lock={salt,digest}
 return true
}

export async function createFamilyVault(){
 const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt'])
 return {publicKey:await crypto.subtle.exportKey('jwk',pair.publicKey),privateKey:await crypto.subtle.exportKey('jwk',pair.privateKey)}
}
export async function sealPassword(publicKey,password){
 const key=await crypto.subtle.importKey('jwk',publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt'])
 return hex(await crypto.subtle.encrypt({name:'RSA-OAEP'},key,encoder.encode(password)))
}
