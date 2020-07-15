import SQLite from "react-native-sqlite-storage";
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "kanji_db.db";
const database_version = "1.0";
const database_displayname = "Kanji database";
const database_size = 200000;

export default class Database {

    initDB() {
        let db;
        return new Promise((resolve) => {
          console.log("Plugin integrity check ...");
          SQLite.echoTest()
            .then(() => {
              console.log("Integrity check passed ...");
              console.log("Opening database ...");
              SQLite.openDatabase(
                { name: 'kanji.db', createFromLocation : 1}
              )
                .then(DB => {
                  db = DB;
                  console.log("Database OPEN");
                  resolve(db);
                })
                .catch(error => {
                  console.log(error);
                });
            })
            .catch(error => {
              console.log("echoTest failed - plugin not functional");
            });
          });
      };
    
    closeDatabase(db) {
        if (db) {
            console.log("Closing DB");
            db.close()
            .then(status => {
                console.log("Database CLOSED");
            })
            .catch(error => {
                this.errorCB(error);
            });
        } else {
            console.log("Database was not OPENED");
        }
    };

    getConsult(){
        return new Promise((resolve) => {
          const consults = [];
          this.initDB().then((db) => {
            db.transaction((tx) => {
              tx.executeSql('SELECT c.kanji_id, k.sound, k.character, c.date, COUNT(c.date) as times FROM consult c INNER JOIN kanji k ON k.number=c.kanji_id GROUP BY c.kanji_id ORDER BY times DESC', []).then(([tx,results]) => {
                console.log("Query completed");
                var len = results.rows.length;
                for (let i = 0; i < len; i++) {
                  let row = results.rows.item(i);
                  const { kanji_id, sound, character, date, times } = row;
                  consults.push({
                    kanji_id,
                    sound,
                    character,
                    date,
                    times
                  });
                }
                resolve(consults);
              });
            }).then((result) => {
              this.closeDatabase(db);
            }).catch((err) => {
              console.log(err);
            });
          }).catch((err) => {
            console.log(err);
          });
        });  
      }

      getByDate(d1,d2){
        return new Promise((resolve) => {
          const consults = [];
          this.initDB().then((db) => {
            db.transaction((tx) => {
              //var s1 = d1.toISOString();
              //var s2 = d2.toISOString();
              tx.executeSql('SELECT c.kanji_id, k.sound, k.character, c.date, COUNT(c.date) as times FROM consult c INNER JOIN kanji k ON k.number=c.kanji_id WHERE c.date>=? AND c.date<=? GROUP BY c.kanji_id ORDER BY times DESC', [d1,d2]).then(([tx,results]) => {
                console.log("Query completed");
                var len = results.rows.length;
                for (let i = 0; i < len; i++) {
                  let row = results.rows.item(i);
                  const { kanji_id, sound, character, date, times } = row;
                  consults.push({
                    kanji_id,
                    sound,
                    character,
                    date,
                    times
                  });
                }
                resolve(consults);
              });
            }).then((result) => {
              this.closeDatabase(db);
            }).catch((err) => {
              console.log(err);
            });
          }).catch((err) => {
            console.log(err);
          });
        });  
      }

    addConsult(chars){
      return new Promise((resolve) => {
        this.initDB().then((db) => {
          db.transaction((tx) => {
            for (var i = 0, len = chars.length; i < len; i++) {
              var now = new Date();
              var sqliteDate = now.toISOString();
              tx.executeSql('INSERT INTO consult (kanji_id,date) VALUES (?, ?)', [chars[i], sqliteDate]).then(([tx, results]) => {
                resolve(results);
              });
            }
          }).then((result) => {
            this.closeDatabase(db);
          }).catch((err) => {
            console.log(err);
          });
        }).catch((err) => {
          console.log(err);
        });
      });  
    }

    getKanji(id) {
      //SQLite.deleteDatabase({name: 'kanji.db', location: "default"});
       console.log("Code: ",id);
        return new Promise((resolve) => {
          this.initDB().then((db) => {
                db.transaction((tx) => {
                tx.executeSql('SELECT * FROM kanji WHERE number = ?', [id]).then(([tx,results]) => {
                    console.log(results);
                    if(results.rows.length > 0) {
                        let row = results.rows.item(0);
                        resolve(row);
                    }
                });
                }).then((result) => {
                    this.closeDatabase(db);
                }).catch((err) => {
                    console.log(err);
                });
            });  
        }).catch((err) => {
            console.log(err);
        });
      }
}