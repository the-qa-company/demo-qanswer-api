/**
 * This script uploads all files in the `files` folder to the QA System
 */

// @ts-check
const path = require('path')
const fsp = require('fs').promises
const FormData = require('form-data')
const { FreeTextFileControllerApi, Configuration } = require('@the-qa-company/qanswer-client')

// Set params (change these to your own)
const qaSystemId = { name: 'demo-nodejs', owner: 'sereyn' }
const dataFolder = path.join(__dirname, 'files')
const authKey = 'YOUR AUTH KEY HERE'
const apiBasePath = 'https://backend.app.qanswer.ai'

/**
 * @returns {Configuration}
 */
function getControllerConfig() {
    return {
      basePath: apiBasePath,
      isJsonMime: mime => mime.toLowerCase().includes('application/json'),
      baseOptions: {
        headers: {
          Authorization: `Bearer ${authKey}`
        }
      }
    }
  }

const fileController = new FreeTextFileControllerApi(getControllerConfig())

function uuid() {
    return Math.random().toString(36).substring(2, 15)
}

async function listFilenames() {
    return await fsp.readdir(dataFolder)
}

async function main() {
    const filenames = await listFilenames()
    const sessionId = uuid() // Any ID generator can be used, we recommend UUIDs
    // For each file, we create a request to upload it
    const promises = filenames.map(async filename => {
        const filepath = path.join(dataFolder, filename)
        const fileBuffer = await fsp.readFile(filepath)
        const formData = new FormData()
        formData.append('file', fileBuffer, { filename })
        // We send formData to QA System
        await fileController.freeTextFileUpload({
            dataset: qaSystemId.name,
            username: qaSystemId.owner,
            sessionId,
            // @ts-ignore
            inlineObject6: formData
        }, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...formData.getHeaders()
            }
        })
        console.log(`File ${filename} uploaded`)
    })
    // Wait for all requests to be finished
    const results = await Promise.allSettled(promises)
    // Show errors if any
    const failNb = results.filter(r => r.status === 'rejected').length
    if (failNb > 0) {
        console.error(`${failNb} files failed to upload`)
    }

    // And then continue and call the convert API with the same sessionId to index the files
    // ...
}

main()
    .catch(err => {
        console.error(err)
    })
