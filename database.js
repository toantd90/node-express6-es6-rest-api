import config from 'config'
import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import User from './models/user'

const mongoDBConnStr = 'mongodb://'

let dbConfig = config.get('dbConfig')
let host = dbConfig.host
let port = dbConfig.port
let name = dbConfig.dbName
let options = dbConfig.options
let connection = mongoDBConnStr + host + ':' + port + '/' + name
let doInit = dbConfig.initSampleData

let CONFIG_FILE_PATH = '/config/default.json'

let initSampleData = () => {
  let users = require('./sample/users.json')

  users.forEach(user => {
    let password = user.password

    let saveUser = new User({name: user.name, username: user.username, birth: user.birth, address: user.address, profession: user.profession})

    saveUser.password = saveUser.generateHash(password)
    saveUser.modifieddate = saveUser.createddate = new Date()
    saveUser.save((err, savedUser) => {
      if (err) {
        return console.error(err)
      }
    })
  })
}

export function initializeDb (pubSub) {
  mongoose.connect(connection, options, (err) => {
    if (err) {
      return console.error(err)
    } else {
      console.log('Database connect success')

      if (doInit) {
        initSampleData()

        let readFilePromise = new Promise((resolve, reject) => {
          fs.readFile(path.join(__dirname, CONFIG_FILE_PATH), 'utf8', (err, fileContent) => {
            if (err) {
              reject(err)
            }
            resolve(JSON.parse(fileContent))
          })
        })

        readFilePromise.then(data => {
          data.dbConfig.initSampleData = false
          let contentStr = JSON.stringify(data)
          fs.writeFile(path.join(__dirname, CONFIG_FILE_PATH), contentStr, (err) => {
            if (err) {
              return console.error(err)
            }
            console.log('Save configuration file successful')
          })
        })
      }
    }
  })
}
