const request = require('sync-request');
const yargs = require('yargs');
const fs = require('fs');

const argv = yargs
    .usage('Example usage: node update.js -i content-all.json -t DRUPAL_ACCESS_TOKEN -h http://localhost:11001 -x "Music and talk,Games"')
    .option('input', {
        alias: 'i',
        default: 'input.json',
        description: 'ElasticSearch extract to use for migration'
    })
    .option('token', {
        alias: 't',
        required: true,
        description: 'Drupal access token'
    })
    .option('host', {
        alias: 'h',
        default: 'http://localhost:11001',
        description: 'Hostname for Drupal'
    })
    .options('exclude', {
        alias: 'x',
        default: 'Music and talk,Games',
        description: 'Categories to exclude from the migration'
    })
    .options('prisons', {
        alias: 'p',
        default: 'wayland,berwyn',
        description: 'Prisons to apply'
    })
    .help()
    .argv;

const PRISON_UUID = { wayland: 'b73767ea-2cbb-4ad5-ba22-09379cc07241', berwyn: 'fd1e1db7-d0be-424a-a3a6-3b0f49e33293' };
const INPUT_FILE = argv.input;
const HOST = argv.host;
const AUTH_TOKEN = argv.token;
const CATEGORY_LIST = argv.exclude.split(',');
const PRISONS = argv.prisons.split(',');

const prisonRelation = prison => ({ type: 'taxonomy_term--prisons', id: PRISON_UUID[prison] });
const createPrisonRelations = prisons => {
    const relations = [];
    for (let prison of prisons) {
        if (PRISON_UUID.hasOwnProperty(prison)) {
            relations.push(prisonRelation(prison));
        }
    }
    return relations;
};

const prisonMigration = (contentType, uuid, prisons) => ({
    data: {
        type: `node--${contentType}`,
        id: uuid,
        relationships: {
            field_moj_prisons: {
                data: createPrisonRelations(prisons)
            }
        }
    }
});

const updateContent = ({ uuid: uuid_a, type: type_a }) => {
    const uuid = uuid_a[0];
    const contentType = type_a[0];
    const url = `${HOST}/jsonapi/node/${contentType}/${uuid}`;
    const postData = prisonMigration(contentType, uuid, PRISONS);
    try {
        console.log(`Request Body: ${JSON.stringify(postData)}`);
        const res = request('PATCH', url, {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Basic ${AUTH_TOKEN}`
            },
            json: postData
        });
        console.log(`Response: ${res.statusCode}`);
    } catch (error) {
        console.log(error);
    }
};

const getData = ({ _source }) => _source;

const byCategories = categoryList => {
    return content => {
        return !Array.isArray(content.category_name) || categoryList.filter(c => content.category_name.includes(c)).length === 0;
    }
};

const byPrison = content => !Array.isArray(content.prison_name) || content.prison_name.length === 0;

fs.readFile(INPUT_FILE, (error, data) => {
    if (error) {
        console.log(error.message);
        return;
    }

    console.log(`Applying migration for ${HOST} using "${INPUT_FILE}" for categories ${CATEGORY_LIST.join()}`);

    const content = JSON.parse(data).hits.hits;

    content.map(getData)
        .filter(byCategories(CATEGORY_LIST))
        .filter(byPrison)
        .forEach(updateContent);
});