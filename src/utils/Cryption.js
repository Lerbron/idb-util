import CryptoJS from 'crypto-js'

const SECRET_KEY= 'IDB_UTIL_KEY'


export const encrypt = (data) => {
  return new Promise((resolve, reject) => {
    let encryptString= CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
    resolve && resolve(encryptString)
  })
}

export const decrypt = data => {
  return new Promise((resolve, reject) => {
    let decryptData= JSON.parse(CryptoJS.AES.decrypt(data, SECRET_KEY).toString(CryptoJS.enc.Utf8))
    resolve && resolve(decryptData)
  })
}