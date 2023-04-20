// import {
//   encrypt,
//   decrypt
// } from './utils/Cryption'

export default class IDBUtil {
  constructor({
    dbName,
    stores = [],
    version = 1
  }) {
    this.dbName = dbName
    this.version = version
    this.stores = stores
    this.db = null
    this.init()
  }


  init() {
    let self = this
    let request = window.indexedDB.open(this.dbName, this.version);
    request.onerror = function (event) {

    };


    request.onsuccess = function (event) {
      self.db = request.result;

    };


    request.onupgradeneeded = function (event) {
      console.log('-------onupgradeneeded-------')
      let db = event.target.result;
      self.initStores(db, self)
    }

  }


  initStores(db, self) {
    self.stores.forEach(store => {
      if (!db.objectStoreNames.contains(store.name)) {
        let options = store.keyPath ? {
          keyPath: store.keyPath
        } : {}
        let objectStore = db.createObjectStore(store.name, options);

        // 是否需要创建索引
        const indexes = store.indexes
        if (indexes instanceof Array && indexes.length > 0) {
          for (let i = 0; i < indexes.length; i++) {
            let indexObj = indexes[i]
            const {
              indexName,
              keyPath,
              objectParameters = {}
            } = indexObj
            if (indexName && keyPath) {
              objectStore.createIndex(indexName, keyPath, objectParameters)
            }
          }
        }
      }
    })
  }

  /**
   *  给指定的store添加数据
   *
   * @param {string} storeName
   * @param {any} data
   * @return {object} 
   * @memberof IDBUtil
   */
  addData(storeName, data) {
    return new Promise((resolve, reject) => {
      let request = this.db.transaction(storeName, 'readwrite')
        .objectStore(storeName)
      request.add(data)
      request.onsuccess = function (event) {
        resolve && resolve({
          status: 'success'
        })
      };

      request.onerror = function (event) {
        reject && reject({
          status: 'fail'
        })
      }
    })
  }


  /**
   * 通过key来获取数据
   * @param {string} storeName
   * @param {string} key
   * @return {*} 
   * @memberof IDBUtil
   */
  getDataByKey(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName]);
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(key);
      request.onerror = function (event) {

        reject && reject('err')
      };

      request.onsuccess = function (event) {
        if (request.result) {
          resolve && resolve(request.result)
        } else {
          resolve && resolve(null)
        }
      };
    })

  }

  /**
   * 通过索引读取数据
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名称
   * @param {string} indexValue 索引值
   */
  getDataByIndex(storeName, indexName, indexValue) {
    return new Promise((resolve, reject) => {
      let objectStore = this.db.transaction(storeName, "readonly").objectStore(storeName);
      const request = objectStore.index(indexName).get(indexValue);
      request.onerror = function () {

        reject && reject({
          status: 'fail',
          msg: '获取失败'
        })
      };
      request.onsuccess = function (e) {
        const result = e.target.result;

        resolve && resolve(result)
      };

    })
  }

  /**
   * 通过索引读取分页数据
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名称
   * @param {string} indexValue 索引值
   * @param {number} page 页面
   * @param {number} pageSize 每页条数
   */
  getDataByIndexAndPage(storeName, indexName, indexValue, page = 1, pageSize = 30) {
    return new Promise((resolve, reject) => {
      let list = [];
      let counter = 0;
      let advanced = true;
      let objectStore = this.db.transaction(storeName, "readonly").objectStore(storeName);
      const store = objectStore.index(indexName);
      let count = store.count(IDBKeyRange.only(indexValue))
      const request= store.openCursor(IDBKeyRange.only(indexValue))
      
      request.onerror = function () {

        reject && reject({
          status: 'fail',
          msg: '获取失败'
        })
      };

      request.onsuccess = function (e) {
        let cursor = e.target.result;
        if (page > 1 && advanced) {
          advanced = false;
          cursor.advance((page - 1) * pageSize);
          return;
        }
        if (cursor) {
          list.push(cursor.value);
          counter++;
          if (counter < pageSize) {
            cursor.continue();
          } else {
            cursor = null;
            resolve && resolve({
              total: count.result,
              list
            })
          }

        } else {
          resolve && resolve({
            total: count.result||0,
            list
          })
        }
      };

    })
  }

  /** 
   * 分页获取数据
   * @param {string} storeName 仓库名称
   * @param {number} page 页数
   * @param {number} pageSize 条数 
   */

  getDataByPage(storeName, page = 1, pageSize = 30) {
    return new Promise((resolve, reject) => {
      let list = [];
      let counter = 0;
      let advanced = true;
      const store = this.db.transaction(storeName, "readonly").objectStore(storeName)
      let request = store.openCursor()
      let count = store.count()

      request.onsuccess = function (e) {
        let cursor = e.target.result;
        if (page > 1 && advanced) {
          advanced = false;
          cursor.advance((page - 1) * pageSize);
          return;
        }
        if (cursor) {
          list.push(cursor.value);
          counter++;
          if (counter < pageSize) {
            cursor.continue();
          } else {
            cursor = null;
            resolve && resolve({
              total: count.result,
              list
            })
          }
        } else {
          resolve && resolve({
            total: count.result||0,
            list
          })
        }
      };
      request.onerror = function (e) {
        reject && reject(e)
      };
    })
  }

  /**
   * 获取名称为storeName的所有数据
   * @param {string} storeName
   * @return {*} 
   * @memberof IDBUtil
   */
  readAllData(storeName) {
    return new Promise((resolve, reject) => {
      let objectStore = this.db.transaction(storeName).objectStore(storeName);
      let data = []
      objectStore.openCursor().onsuccess = function (event) {
        const cursor = event.target.result;

        if (cursor) {
          data.push(cursor.value)
          cursor.continue();
          // decrypt(cursor.value.value)
          //   .then(value => {
          //     data.push(value)
          //     cursor.continue();
          //   })
        } else {

          resolve && resolve(data)
        }
      };
    })
  }

  /**
   *更新指定store的数据
   * @param {string} storeName
   * @param {any} data
   * @return {object} 
   * @memberof IDBUtil
   */
  updateData(storeName, data) {
    return new Promise((resolve, reject) => {

      let request = this.db.transaction([storeName], 'readwrite')
        .objectStore(storeName)

      request.put(data)
      request.onsuccess = function (event) {

        resolve && resolve({
          status: 'success'
        })
      };

      request.onerror = function (event) {

        reject && reject({
          status: 'fail'
        })
      }
    })
  }

  /**
   * 通过主键删除数据
   * @param {object} db 数据库实例
   * @param {string} storeName 仓库名称
   * @param {string} key 主键值
   */
  deleteData(storeName, key) {
    return new Promise((resolve, reject) => {

      let request = this.db
        .transaction([storeName], "readwrite")
        .objectStore(storeName)
        .delete(key);

      request.onsuccess = function (event) {

        resolve && resolve({
          status: 'success'
        })
      };

      request.onerror = function (event) {

        reject && reject({
          status: 'fail',
          data: event
        })
      };
    })
  }

  /**
   * 通过索引和游标删除指定的数据
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名
   * @param {any} indexValue 索引值
   */
  deleteDataByIndex(storeName, indexName, indexValue) {
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(storeName, "readwrite").objectStore(storeName);
      const request = store
        .index(indexName) // 索引对象
        .openCursor(IDBKeyRange.only(indexValue)); // 指针对象
      request.onsuccess = function (e) {
        let cursor = e.target.result;
        let deleteRequest;
        if (cursor) {
          deleteRequest = cursor.delete(); // 请求删除当前项
          deleteRequest.onerror = function () {

            reject && reject({
              status: 'fail',
              msg: '游标删除该记录失败'
            })
          };
          deleteRequest.onsuccess = function () {

            resolve && resolve({
              status: 'success',
              msg: '游标删除该记录成功'
            })
          };
          cursor.continue();
        }
      };
      request.onerror = function (e) {
        reject && reject({
          status: 'fail',
          msg: 'deleteRequest 失败'
        })
      };
    })
  }

  /**
   * 清除指定store
   * @param {string} storeName
   * @return {object} 
   * @memberof IDBUtil
   */
  clearStore(storeName) {
    return new Promise((resolve, reject) => {
      let request = this.db.transaction([storeName], 'readwrite')
        .objectStore(storeName)
        .clear()

      request.onsuccess = function (event) {

        resolve && resolve({
          status: 'success'
        })
      };

      request.onerror = function (event) {

        reject && reject({
          status: 'fail'
        })
      }
    })
  }

  /**
   * 清除所有的store
   * @return {*} 
   * @memberof IDBUtil
   */
  clearAllStore() {
    return new Promise((resolve, reject) => {

      let promises = []
      this.stores.map(store => {
        const storeName = store.name
        promises.push(this.clearStore(storeName))
      })
      Promise.all(promises).then(res => {

          resolve && resolve({
            status: 'success'
          })
        })
        .catch(err => {
          reject && reject(err)
        })
    })
  }


  deleteDatabase() {
    return new Promise((resolve, reject) => {
      debugger
      const DBDeleteRequest= window.indexedDB.deleteDatabase(this.dbName)
      DBDeleteRequest.onerror = (event) => {
        console.error("Error deleting database.");
        reject && reject(event)
      };
      
      DBDeleteRequest.onsuccess = (event) => {
        console.log("Database deleted successfully");
      
        console.log(event); // should be undefined
        resolve && resolve({
          status: 'success'
        })
      };
    })
  }


}