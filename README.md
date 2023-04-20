# idb-util
浏览器数据库 IndexedDB

#### 安装
```javascript
yarn add idb-util
```
or
```javascript
npm install idb-util
```
#### 初始化
```javascript
const IDB= new IDBUtil({
    dbName: 'TEST_IDB',  // 数据库名
    stores: [
      /*
      * @param {string} name 仓库名称
      * @param {string} keyPath 主键名
      * @param {array} indexes 需要创建的索引 [{indexName, keyPath, objectParameters}] 可选参数
      */
      {
        name: 'LIST',
        keyPath: 'order',
        indexes: [{indexName: 'name', keyPath: 'name'}, {indexName: 'id', keyPath: 'id'}]
      },
    ],
    version: 1
  })
```

#### 使用

##### 1、给指定的store添加数据
```javascript
 /**
   * @param {string} storeName
   * @param {any} data
   * @return {object} 
 */
 
IDB.addData('LIST', {order: 1, name: 'bruce', 'id': '0x001'})
  .then(res => {
    console.log('res=====>', res)
  })

IDB.addData('LIST', {order: 2, name: 'frank', 'id': '0x002'})
  .then(res => {
    console.log('res=====>', res)
  })
  
 IDB.addData('LIST', {order: 3, name: 'frank02', 'id': '0x002'})
  .then(res => {
    console.log('res=====>', res)
  })
```

##### 2、通过主键读取数据
```javascript
/**
   * @param {string} storeName
   * @param {string} key
*/

IDB.getDataByKey('LIST', 1)
.then(result => {
  console.log('getDataByKey result--->', result)
})
```


##### 3、通过索引读取数据
```javascript
/**
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名称
   * @param {string} indexValue 索引值
*/

IDB.getDataByIndex('LIST', 'id', '0x002')
  .then(result => {
    console.log('getDataByIndex result--->', result)
  })
```

##### 4、根据主键，分页获取数据
```javascript
/** 
   * @param {string} storeName 仓库名称
   * @param {number} page 页数
   * @param {number} pageSize 条数 
*/
IDB.getDataByPage('LIST', 2, 1)
  .then(result => {
    console.log('getDataByPage result--->', result)
  })
```

##### 5、通过索引读取分页数据
```javascript
/**
   * @param {string} storeName 仓库名称
   * @param {string} indexName 索引名称
   * @param {string} indexValue 索引值
   * @param {number} page 页面
   * @param {number} pageSize 每页条数
*/

 IDB.getDataByIndexAndPage('LIST', 'id', '0x002', 1, 1)
   .then(result => {
     console.log('getDataByIndexAndPage result--->', result)
   })
```


##### 6、获取名称为storeName的所有数据
```javascript
 /**
   * @param {string} storeName
   * @return {*} 
 */
 
 IDB.readAllData('LIST')
  .then(result => {
    console.log('result--->', result)
  })
```

##### 7、更新指定store的数据
```javascript
/**
   * @param {string} storeName
   * @param {any} data
*/

IDB.updateData('LIST', {order: 3, name: 'Lee', 'id': '0x003'})
  .then(result => {
    console.log('update--->', result)
  })
```

##### 8、清除指定store
```javascript
/**
   * @param {string} storeName
   * @return {object} 
*/

IDB.clearStore('LIST')
  .then(res => {
    console.log('clearStore-->', res)
  })
```


          
