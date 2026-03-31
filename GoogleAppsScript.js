// ==========================================
// KODE GOOGLE APPS SCRIPT (simpan di Code.gs)
// ==========================================

function getActiveSheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ------------------------------------------
// MENGAMBIL DATA (GET) DARI GOOGLE SHEETS
// ------------------------------------------
function doGet(e) {
  var ss = getActiveSheet();
  var sheets = ["Balita", "Hamil", "Lansia", "ODGJ", "Imun", "Jamban", "PSN"];
  var result = {};

  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      if (data.length > 1) { // Jika memiliki form list (selain header)
        var headers = data.shift(); // Pisahkan baris pertama sebagai Header (Key JSON)
        var rows = data.map(function(row) {
          var obj = {};
          headers.forEach(function(header, index) {
            obj[header] = row[index];
          });
          return obj;
        });
        result[sheetName.toLowerCase()] = rows;
      } else {
        result[sheetName.toLowerCase()] = [];
      }
    } else {
      result[sheetName.toLowerCase()] = []; // Sheet belum ada
    }
  });

  // Mengembalikan data JSON
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ------------------------------------------
// MENYIMPAN DATA (POST) KE GOOGLE SHEETS
// ------------------------------------------
function doPost(e) {
  try {
    var payloadData;
    // Menerima raw string JSON (sebaiknya mode text/plain dari javascript fetch untuk menghindari limitasi CORS browser)
    if (e.postData && e.postData.contents) {
       payloadData = JSON.parse(e.postData.contents);
    } else {
       return throwError("Data POST kosong");
    }

    var type = payloadData.type; // "balita", "hamil", dsb.
    var payload = payloadData.payload;
    
    var typeSheetMap = {
      "balita": "Balita",
      "hamil": "Hamil",
      "lansia": "Lansia",
      "odgj": "ODGJ",
      "imun": "Imun",
      "jamban": "Jamban",
      "psn": "PSN"
    };

    var sheetName = typeSheetMap[type.toLowerCase()];
    if(!sheetName) return throwError("Kategori tidak valid: " + type);

    var ss = getActiveSheet();
    var sheet = ss.getSheetByName(sheetName);
    
    // Memasukkan array header secara otomatis jika terdeteksi Sheet kosong
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = [];
    if (sheet.getLastRow() === 0) {
      headers = Object.keys(payload);
      sheet.appendRow(headers);
    } else {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Memetakan input berdasar header ke sebuah Array baris
    var newRow = headers.map(function(header) {
      return (payload[header] !== undefined && payload[header] !== null) ? payload[header] : "";
    });
    
    sheet.appendRow(newRow); // Insert di paling bawah!

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data " + type + " berhasil didaftarkan"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
     return throwError(error.toString());
  }
}

function throwError(msg) {
  return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: msg
  })).setMimeType(ContentService.MimeType.JSON);
}
