# Prisoner Content Hub Migrations

Migration scripts for Prisoner Content Hub Content

## Requirements

```
Node >= 12
```

## Installing

```
npm i
```

## Usage

### Pulling ElasticSearch extracts

```
curl -XGET 'localhost:9200/elasticsearch_index_hubdb_content_index/_search?size=4000' -d '{\"query\" : {\"match_all\" : {}}}'" > ~/content-all.json
```

### Running the script

```
node migrate.js help

Example usage: node migrate.js -i content-all.json -t DRUPAL_ACCESS_TOKEN -h
http://localhost:11001 -x "Music and talk,Games"

Options:
  --version      Show version number                                   [boolean]
  --input, -i    ElasticSearch extract to use for migration
                                                         [default: "input.json"]
  --token, -t    Drupal access token                                  [required]
  --host, -h     Hostname for Drupal         [default: "http://localhost:11001"]
  --exclude, -x  Categories to exclude from the migration
                                               [default: "Music and talk,Games"]
  --prisons, -p  Prisons to apply                    [default: "wayland,berwyn"]
  --help         Show help                                             [boolean]
```
