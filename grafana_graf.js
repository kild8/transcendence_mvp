{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "id": 0,
  "links": [],
  "panels": [
    {
      "collapsed": true,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 0
      },
      "id": 19,
      "panels": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 0,
            "y": 1
          },
          "id": 22,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"nginx-frontend\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "nginx-frontend",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 4,
            "y": 1
          },
          "id": 32,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"nodejs-backend\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "nodejs-backend",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 8,
            "y": 1
          },
          "id": 21,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"filebeat\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "filebeat",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 12,
            "y": 1
          },
          "id": 27,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"node-exporter\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "node-exporter",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 16,
            "y": 1
          },
          "id": 31,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"alertmanager-discord\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "alertmanager-discord",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 20,
            "y": 1
          },
          "id": 25,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"hashicorp-vault\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "hashicorp-vault",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 0,
            "y": 4
          },
          "id": 23,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"logstash\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "logstash",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 4,
            "y": 4
          },
          "id": 28,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"elasticsearch\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "elasticsearch",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 8,
            "y": 4
          },
          "id": 24,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"kibana\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "kibana",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 12,
            "y": 4
          },
          "id": 20,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"nginx-prometheus-exporter\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "nginx-prometheus-exporter",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 16,
            "y": 4
          },
          "id": 26,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"cadvisor\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "cadvisor",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 20,
            "y": 4
          },
          "id": 29,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"alertmanager\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "alertmanager",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 0,
            "y": 7
          },
          "id": 30,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"prometheus\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "prometheus",
          "type": "stat"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "fieldConfig": {
            "defaults": {
              "color": {
                "mode": "thresholds"
              },
              "mappings": [
                {
                  "options": {
                    "0": {
                      "color": "semi-dark-red",
                      "index": 0,
                      "text": "DEAD"
                    },
                    "1": {
                      "color": "semi-dark-green",
                      "index": 1,
                      "text": "ALIVE"
                    }
                  },
                  "type": "value"
                }
              ],
              "thresholds": {
                "mode": "absolute",
                "steps": [
                  {
                    "color": "green",
                    "value": 0
                  }
                ]
              }
            },
            "overrides": []
          },
          "gridPos": {
            "h": 3,
            "w": 4,
            "x": 4,
            "y": 7
          },
          "id": 33,
          "options": {
            "colorMode": "background_solid",
            "graphMode": "none",
            "justifyMode": "auto",
            "orientation": "auto",
            "percentChangeColorMode": "standard",
            "reduceOptions": {
              "calcs": [
                "lastNotNull"
              ],
              "fields": "",
              "values": false
            },
            "showPercentChange": false,
            "textMode": "auto",
            "wideLayout": true
          },
          "pluginVersion": "12.3.1",
          "targets": [
            {
              "editorMode": "code",
              "expr": "(count(container_start_time_seconds{name=\"grafana\"})) OR on(name) vector(0)",
              "legendFormat": "__auto",
              "range": true,
              "refId": "A"
            }
          ],
          "title": "grafana",
          "type": "stat"
        }
      ],
      "title": "Containers",
      "type": "row"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 1
      },
      "id": 10,
      "panels": [],
      "title": "Game",
      "type": "row"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 0,
        "y": 2
      },
      "id": 34,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "login_counter",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Logins Total",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 4,
        "y": 2
      },
      "id": 35,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "logout_counter",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Logouts Total",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 9,
        "w": 13,
        "x": 8,
        "y": 2
      },
      "id": 36,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "exited_games_counter",
          "legendFormat": "Exited Games",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Games Exited",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 0,
        "y": 5
      },
      "id": 37,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "players_connected",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Online Players",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 4,
        "y": 5
      },
      "id": 38,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "game_duration_seconds_sum / clamp_min(total_ended_games, 1)",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Average Game Duration",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 0,
        "y": 8
      },
      "id": 39,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "games_in_progress",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Games in Progress",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 4,
        "y": 8
      },
      "id": 40,
      "options": {
        "colorMode": "value",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "total_ended_games",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Total Ended Games",
      "type": "stat"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 11
      },
      "id": 4,
      "panels": [],
      "title": "Requests",
      "type": "row"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 5,
        "x": 0,
        "y": 12
      },
      "id": 1,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "editorMode": "code",
          "expr": "time() - process_start_time_seconds{job=\"nodejs-backend\"}",
          "instant": false,
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Backend Uptime",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "decimals": 0,
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 4,
        "x": 5,
        "y": 12
      },
      "id": 2,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "sum(increase(http_requests_total{job=\"nodejs-backend\"}[$__range]))",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Total Requests",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              },
              {
                "color": "semi-dark-red",
                "value": 0.1
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 5,
        "x": 9,
        "y": 12
      },
      "id": 5,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "(sum((increase(http_requests_total{job=\"nodejs-backend\", status=~\"4..\"}[$__range]) or vector(0))) + sum((increase(http_requests_total{job=\"nodejs-backend\", status=~\"5..\"}[$__range]) or vector(0)))) / sum((increase(http_requests_total{job=\"nodejs-backend\"}[$__range])))",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Error Rate",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              },
              {
                "color": "semi-dark-red",
                "value": 0.1
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 5,
        "x": 14,
        "y": 12
      },
      "id": 6,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "sum(rate(http_request_duration_seconds_sum[30m])) / sum(rate(http_request_duration_seconds_count[30m]))",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Average Request Duration",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              }
            ]
          }
        },
        "overrides": []
      },
      "gridPos": {
        "h": 3,
        "w": 5,
        "x": 19,
        "y": 12
      },
      "id": 7,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "sum(http_requests_in_flight{job=\"nodejs-backend\", route!=\"/metrics\"})",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Requests in Progress",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          },
          "unit": "reqps"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 24,
        "x": 0,
        "y": 15
      },
      "id": 11,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "rate(http_requests_total{job=\"nodejs-backend\"}[5m])",
          "legendFormat": "{{method}} {{route}} {{status}}",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "API Throughput",
      "type": "timeseries"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 21
      },
      "id": 3,
      "panels": [],
      "title": "Errors",
      "type": "row"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            }
          },
          "mappings": []
        },
        "overrides": []
      },
      "gridPos": {
        "h": 6,
        "w": 24,
        "x": 0,
        "y": 22
      },
      "id": 12,
      "options": {
        "legend": {
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "pieType": "donut",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "sort": "desc",
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "sum(rate(http_requests_total{job=\"nodejs-backend\"}[5m])) by (status)",
          "legendFormat": "Status {{status}}",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Requests by Status Code",
      "type": "piechart"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 28
      },
      "id": 8,
      "panels": [],
      "title": "Duration",
      "type": "row"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 24,
        "x": 0,
        "y": 29
      },
      "id": 13,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket{job=\"nodejs-backend\"}[5m])) by (le))",
          "legendFormat": "p50",
          "range": true,
          "refId": "A"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "editorMode": "code",
          "expr": "histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket{job=\"nodejs-backend\"}[5m])) by (le))",
          "hide": false,
          "instant": false,
          "legendFormat": "p90",
          "range": true,
          "refId": "B"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "editorMode": "code",
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"nodejs-backend\"}[5m])) by (le))",
          "hide": false,
          "instant": false,
          "legendFormat": "p95",
          "range": true,
          "refId": "C"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "editorMode": "code",
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job=\"nodejs-backend\"}[5m])) by (le))",
          "hide": false,
          "instant": false,
          "legendFormat": "p99",
          "range": true,
          "refId": "D"
        }
      ],
      "title": "API Latency Percentiles",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              }
            ]
          },
          "unit": "s"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 24,
        "x": 0,
        "y": 36
      },
      "id": 14,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "(rate(http_request_duration_seconds_sum[1m])) / (rate(http_request_duration_seconds_count[1m]))",
          "legendFormat": "{{method}} {{route}} {{status}}",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Average Duration of Request",
      "type": "timeseries"
    },
    {
      "collapsed": false,
      "gridPos": {
        "h": 1,
        "w": 24,
        "x": 0,
        "y": 43
      },
      "id": 9,
      "panels": [],
      "title": "System Metrics",
      "type": "row"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "decimals": 2,
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 6,
        "x": 0,
        "y": 44
      },
      "id": 15,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "rate(process_cpu_seconds_total{job=\"nodejs-backend\"}[5m])",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "CPU Usage",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "bytes"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 10,
        "w": 12,
        "x": 6,
        "y": 44
      },
      "id": 17,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "process_resident_memory_bytes{job=\"nodejs-backend\"}",
          "legendFormat": "Resident Memory",
          "range": true,
          "refId": "A"
        },
        {
          "datasource": {
            "type": "prometheus",
            "uid": "dfaku0jjnrdhcf"
          },
          "editorMode": "code",
          "expr": "process_virtual_memory_bytes{job=\"nodejs-backend\"}",
          "hide": false,
          "instant": false,
          "legendFormat": "Virtual Memory",
          "range": true,
          "refId": "B"
        }
      ],
      "title": "Memory Usage",
      "type": "timeseries"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "thresholds"
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "semi-dark-green",
                "value": 0
              }
            ]
          },
          "unit": "percentunit"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 5,
        "w": 6,
        "x": 0,
        "y": 49
      },
      "id": 16,
      "options": {
        "colorMode": "background_solid",
        "graphMode": "none",
        "justifyMode": "auto",
        "orientation": "auto",
        "percentChangeColorMode": "standard",
        "reduceOptions": {
          "calcs": [
            "lastNotNull"
          ],
          "fields": "",
          "values": false
        },
        "showPercentChange": false,
        "textMode": "auto",
        "wideLayout": true
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "process_open_fds{job=\"nodejs-backend\"} / process_max_fds{job=\"nodejs-backend\"}",
          "legendFormat": "__auto",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Open File Descriptors",
      "type": "stat"
    },
    {
      "datasource": {
        "type": "prometheus",
        "uid": "dfaku0jjnrdhcf"
      },
      "fieldConfig": {
        "defaults": {
          "color": {
            "mode": "palette-classic"
          },
          "custom": {
            "axisBorderShow": false,
            "axisCenteredZero": false,
            "axisColorMode": "text",
            "axisLabel": "",
            "axisPlacement": "auto",
            "barAlignment": 0,
            "barWidthFactor": 0.6,
            "drawStyle": "line",
            "fillOpacity": 0,
            "gradientMode": "none",
            "hideFrom": {
              "legend": false,
              "tooltip": false,
              "viz": false
            },
            "insertNulls": false,
            "lineInterpolation": "linear",
            "lineWidth": 1,
            "pointSize": 5,
            "scaleDistribution": {
              "type": "linear"
            },
            "showPoints": "auto",
            "showValues": false,
            "spanNulls": false,
            "stacking": {
              "group": "A",
              "mode": "none"
            },
            "thresholdsStyle": {
              "mode": "off"
            }
          },
          "mappings": [],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": 0
              },
              {
                "color": "red",
                "value": 80
              }
            ]
          },
          "unit": "GC/sec"
        },
        "overrides": []
      },
      "gridPos": {
        "h": 7,
        "w": 18,
        "x": 0,
        "y": 54
      },
      "id": 18,
      "options": {
        "legend": {
          "calcs": [],
          "displayMode": "list",
          "placement": "bottom",
          "showLegend": true
        },
        "tooltip": {
          "hideZeros": false,
          "mode": "single",
          "sort": "none"
        }
      },
      "pluginVersion": "12.3.1",
      "targets": [
        {
          "editorMode": "code",
          "expr": "rate(nodejs_gc_duration_seconds_count{job=\"nodejs-backend\"}[5m])",
          "legendFormat": "{{kind}}",
          "range": true,
          "refId": "A"
        }
      ],
      "title": "Garbage Collection Rate",
      "type": "timeseries"
    }
  ],
  "preload": false,
  "refresh": "",
  "schemaVersion": 42,
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-5m",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "browser",
  "title": "TranscendenceDashboard-1",
  "uid": "dfaku0jjnrdhcf",
  "version": 6
}