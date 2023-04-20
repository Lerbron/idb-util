function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

// import {
//   encrypt,
//   decrypt
// } from './utils/Cryption'
var IDBUtil = /*#__PURE__*/function () {
  function IDBUtil(_ref) {
    var dbName = _ref.dbName,
      _ref$stores = _ref.stores,
      stores = _ref$stores === void 0 ? [] : _ref$stores,
      _ref$version = _ref.version,
      version = _ref$version === void 0 ? 1 : _ref$version;
    _classCallCheck(this, IDBUtil);
    this.dbName = dbName;
    this.version = version;
    this.stores = stores;
    this.db = null;
    this.init();
  }
  _createClass(IDBUtil, [{
    key: "init",
    value: function init() {
      var self = this;
      var request = window.indexedDB.open(this.dbName, this.version);
      request.onerror = function (event) {};
      request.onsuccess = function (event) {
        self.db = request.result;
      };
      request.onupgradeneeded = function (event) {
        console.log('-------onupgradeneeded-------');
        var db = event.target.result;
        self.initStores(db, self);
      };
    }
  }, {
    key: "initStores",
    value: function initStores(db, self) {
      self.stores.forEach(function (store) {
        if (!db.objectStoreNames.contains(store.name)) {
          var options = store.keyPath ? {
            keyPath: store.keyPath
          } : {};
          var objectStore = db.createObjectStore(store.name, options);

          // 是否需要创建索引
          var indexes = store.indexes;
          if (indexes instanceof Array && indexes.length > 0) {
            for (var i = 0; i < indexes.length; i++) {
              var indexObj = indexes[i];
              var indexName = indexObj.indexName,
                keyPath = indexObj.keyPath,
                _indexObj$objectParam = indexObj.objectParameters,
                objectParameters = _indexObj$objectParam === void 0 ? {} : _indexObj$objectParam;
              if (indexName && keyPath) {
                objectStore.createIndex(indexName, keyPath, objectParameters);
              }
            }
          }
        }
      });
    }

    /**
     *  给指定的store添加数据
     *
     * @param {string} storeName
     * @param {any} data
     * @return {object} 
     * @memberof IDBUtil
     */
  }, {
    key: "addData",
    value: function addData(storeName, data) {
      var _this = this;
      return new Promise(function (resolve, reject) {
        var request = _this.db.transaction(storeName, 'readwrite').objectStore(storeName);
        request.add(data);
        request.onsuccess = function (event) {
          resolve && resolve({
            status: 'success'
          });
        };
        request.onerror = function (event) {
          reject && reject({
            status: 'fail'
          });
        };
      });
    }

    /**
     * 通过key来获取数据
     * @param {string} storeName
     * @param {string} key
     * @return {*} 
     * @memberof IDBUtil
     */
  }, {
    key: "getDataByKey",
    value: function getDataByKey(storeName, key) {
      var _this2 = this;
      return new Promise(function (resolve, reject) {
        var transaction = _this2.db.transaction([storeName]);
        var objectStore = transaction.objectStore(storeName);
        var request = objectStore.get(key);
        request.onerror = function (event) {
          reject && reject('err');
        };
        request.onsuccess = function (event) {
          if (request.result) {
            resolve && resolve(request.result);
          } else {
            resolve && resolve(null);
          }
        };
      });
    }

    /**
     * 通过索引读取数据
     * @param {string} storeName 仓库名称
     * @param {string} indexName 索引名称
     * @param {string} indexValue 索引值
     */
  }, {
    key: "getDataByIndex",
    value: function getDataByIndex(storeName, indexName, indexValue) {
      var _this3 = this;
      return new Promise(function (resolve, reject) {
        var objectStore = _this3.db.transaction(storeName, "readonly").objectStore(storeName);
        var request = objectStore.index(indexName).get(indexValue);
        request.onerror = function () {
          reject && reject({
            status: 'fail',
            msg: '获取失败'
          });
        };
        request.onsuccess = function (e) {
          var result = e.target.result;
          resolve && resolve(result);
        };
      });
    }

    /**
     * 通过索引读取分页数据
     * @param {string} storeName 仓库名称
     * @param {string} indexName 索引名称
     * @param {string} indexValue 索引值
     * @param {number} page 页面
     * @param {number} pageSize 每页条数
     */
  }, {
    key: "getDataByIndexAndPage",
    value: function getDataByIndexAndPage(storeName, indexName, indexValue) {
      var _this4 = this;
      var page = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
      var pageSize = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 30;
      return new Promise(function (resolve, reject) {
        var list = [];
        var counter = 0;
        var advanced = true;
        var objectStore = _this4.db.transaction(storeName, "readonly").objectStore(storeName);
        var store = objectStore.index(indexName);
        var count = store.count(IDBKeyRange.only(indexValue));
        var request = store.openCursor(IDBKeyRange.only(indexValue));
        request.onerror = function () {
          reject && reject({
            status: 'fail',
            msg: '获取失败'
          });
        };
        request.onsuccess = function (e) {
          var cursor = e.target.result;
          if (page > 1 && advanced) {
            advanced = false;
            cursor.advance((page - 1) * pageSize);
            return;
          }
          if (cursor) {
            list.push(cursor.value);
            counter++;
            if (counter < pageSize) {
              cursor["continue"]();
            } else {
              cursor = null;
              resolve && resolve({
                total: count.result,
                list: list
              });
            }
          } else {
            resolve && resolve({
              total: count.result || 0,
              list: list
            });
          }
        };
      });
    }

    /** 
     * 分页获取数据
     * @param {string} storeName 仓库名称
     * @param {number} page 页数
     * @param {number} pageSize 条数 
     */
  }, {
    key: "getDataByPage",
    value: function getDataByPage(storeName) {
      var _this5 = this;
      var page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var pageSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 30;
      return new Promise(function (resolve, reject) {
        var list = [];
        var counter = 0;
        var advanced = true;
        var store = _this5.db.transaction(storeName, "readonly").objectStore(storeName);
        var request = store.openCursor();
        var count = store.count();
        request.onsuccess = function (e) {
          var cursor = e.target.result;
          if (page > 1 && advanced) {
            advanced = false;
            cursor.advance((page - 1) * pageSize);
            return;
          }
          if (cursor) {
            list.push(cursor.value);
            counter++;
            if (counter < pageSize) {
              cursor["continue"]();
            } else {
              cursor = null;
              resolve && resolve({
                total: count.result,
                list: list
              });
            }
          } else {
            resolve && resolve({
              total: count.result || 0,
              list: list
            });
          }
        };
        request.onerror = function (e) {
          reject && reject(e);
        };
      });
    }

    /**
     * 获取名称为storeName的所有数据
     * @param {string} storeName
     * @return {*} 
     * @memberof IDBUtil
     */
  }, {
    key: "readAllData",
    value: function readAllData(storeName) {
      var _this6 = this;
      return new Promise(function (resolve, reject) {
        var objectStore = _this6.db.transaction(storeName).objectStore(storeName);
        var data = [];
        objectStore.openCursor().onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            data.push(cursor.value);
            cursor["continue"]();
            // decrypt(cursor.value.value)
            //   .then(value => {
            //     data.push(value)
            //     cursor.continue();
            //   })
          } else {
            resolve && resolve(data);
          }
        };
      });
    }

    /**
     *更新指定store的数据
     * @param {string} storeName
     * @param {any} data
     * @return {object} 
     * @memberof IDBUtil
     */
  }, {
    key: "updateData",
    value: function updateData(storeName, data) {
      var _this7 = this;
      return new Promise(function (resolve, reject) {
        var request = _this7.db.transaction([storeName], 'readwrite').objectStore(storeName);
        request.put(data);
        request.onsuccess = function (event) {
          resolve && resolve({
            status: 'success'
          });
        };
        request.onerror = function (event) {
          reject && reject({
            status: 'fail'
          });
        };
      });
    }

    /**
     * 通过主键删除数据
     * @param {object} db 数据库实例
     * @param {string} storeName 仓库名称
     * @param {string} key 主键值
     */
  }, {
    key: "deleteData",
    value: function deleteData(storeName, key) {
      var _this8 = this;
      return new Promise(function (resolve, reject) {
        var request = _this8.db.transaction([storeName], "readwrite").objectStore(storeName)["delete"](key);
        request.onsuccess = function (event) {
          resolve && resolve({
            status: 'success'
          });
        };
        request.onerror = function (event) {
          reject && reject({
            status: 'fail',
            data: event
          });
        };
      });
    }

    /**
     * 通过索引和游标删除指定的数据
     * @param {string} storeName 仓库名称
     * @param {string} indexName 索引名
     * @param {any} indexValue 索引值
     */
  }, {
    key: "deleteDataByIndex",
    value: function deleteDataByIndex(storeName, indexName, indexValue) {
      var _this9 = this;
      return new Promise(function (resolve, reject) {
        var store = _this9.db.transaction(storeName, "readwrite").objectStore(storeName);
        var request = store.index(indexName) // 索引对象
        .openCursor(IDBKeyRange.only(indexValue)); // 指针对象
        request.onsuccess = function (e) {
          var cursor = e.target.result;
          var deleteRequest;
          if (cursor) {
            deleteRequest = cursor["delete"](); // 请求删除当前项
            deleteRequest.onerror = function () {
              reject && reject({
                status: 'fail',
                msg: '游标删除该记录失败'
              });
            };
            deleteRequest.onsuccess = function () {
              resolve && resolve({
                status: 'success',
                msg: '游标删除该记录成功'
              });
            };
            cursor["continue"]();
          }
        };
        request.onerror = function (e) {
          reject && reject({
            status: 'fail',
            msg: 'deleteRequest 失败'
          });
        };
      });
    }

    /**
     * 清除指定store
     * @param {string} storeName
     * @return {object} 
     * @memberof IDBUtil
     */
  }, {
    key: "clearStore",
    value: function clearStore(storeName) {
      var _this10 = this;
      return new Promise(function (resolve, reject) {
        var request = _this10.db.transaction([storeName], 'readwrite').objectStore(storeName).clear();
        request.onsuccess = function (event) {
          resolve && resolve({
            status: 'success'
          });
        };
        request.onerror = function (event) {
          reject && reject({
            status: 'fail'
          });
        };
      });
    }

    /**
     * 清除所有的store
     * @return {*} 
     * @memberof IDBUtil
     */
  }, {
    key: "clearAllStore",
    value: function clearAllStore() {
      var _this11 = this;
      return new Promise(function (resolve, reject) {
        var promises = [];
        _this11.stores.map(function (store) {
          var storeName = store.name;
          promises.push(_this11.clearStore(storeName));
        });
        Promise.all(promises).then(function (res) {
          resolve && resolve({
            status: 'success'
          });
        })["catch"](function (err) {
          reject && reject(err);
        });
      });
    }
  }, {
    key: "deleteDatabase",
    value: function deleteDatabase() {
      var _this12 = this;
      return new Promise(function (resolve, reject) {
        debugger;
        var DBDeleteRequest = window.indexedDB.deleteDatabase(_this12.dbName);
        DBDeleteRequest.onerror = function (event) {
          console.error("Error deleting database.");
          reject && reject(event);
        };
        DBDeleteRequest.onsuccess = function (event) {
          console.log("Database deleted successfully");
          console.log(event); // should be undefined
          resolve && resolve({
            status: 'success'
          });
        };
      });
    }
  }]);
  return IDBUtil;
}();

export { IDBUtil as default };
