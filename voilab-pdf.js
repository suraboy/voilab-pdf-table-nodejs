const fs = require('fs');
import moment from 'moment';

const regular = '/usr/src/app/public/fonts/THSarabunNew.ttf';
const bold = '/usr/src/app/public/fonts/THSarabunNewBold.ttf';
var commaNumber = require('comma-number');
const PDFTable = require('voilab-pdf-table');
const PDFDocument = require('pdfkit');

exports.createPdf = async function (outletData, reportData, fileName) {
    try {
        const doc = new PDFDocument({margin: 50,size:'A4'});
        const table = new PDFTable(doc, {bottomMargin: 30});
        //set header
        await generateHeader(doc, outletData);
        // set Body
        await generateSaleVatTable(doc, table, reportData)
        // create stream create file pdf
        const writeStream = await fs.createWriteStream('./public/report_files/sale-vat-reports/' + fileName + '.pdf')
        await doc.pipe(writeStream)
        // do stuff with the PDF file
        await doc.end();
        // HERE PDF FILE IS DONE
        console.log('Create PDF file done.');
    } catch (err) {
        console.log('Create file fail :' + err);
        return err;
    }
    ;
}

const generateHeader = (doc, outlet) => {
    let brandName = checkNameData(JSON.parse(outlet.brand_name));
    let outletName = checkNameData(JSON.parse(outlet.outlet_name));
    doc.fillColor('#444444').fontSize(7).font(bold).text('รายงานภาษีขาย', {align: 'center'}).moveDown();

    doc.fillColor('#444444')
    //left header
        .fontSize(7)
        .font(bold)
        .text('ชื่อบริษัท', 50, 80, {align: 'left'})
        .font(regular)
        .text('TRUE LIFESTYLE RETAIL CO., LTD', 100, 80)
        .font(bold)
        .text('ร้านค้า', 50, 95, {align: 'left'})
        .font(regular)
        .text(brandName, 100, 95)
        .font(bold)
        .text('สาขา', 200, 95)
        .font(regular)
        .text(outletName, 250, 95)
        .font(bold)
        .text('ที่อยู่', 50, 110, {align: 'left'})
        .font(regular)
        .text(outlet.address + ' , ' + outlet.sub_district + ' , ' + outlet.district + ' , ' + outlet.province + ' ' + outlet.post_code, 100, 110)
        //right header
        .fontSize(7)
        .font(bold)
        .text('เลขประจำตัวผู้เสียภาษี', 400, 80)
        .font(regular)
        .text(outlet.tax_no, 200, 80, {align: 'right'})
        .font(bold)
        .text('เดือนภาษี', 400, 95)
        .font(regular)
        .text(toBuddhistYear(moment(outlet.order_created_start_at).locale('th'), 'MMMM YYYY'), 200, 95, {align: 'right'})
        .font(bold)
        .text('พิมพ์ที่', 400, 110)
        .font(regular)
        .text('[/] สำนักงานใหญ่ [ ] สาขา', 200, 110, {align: 'right'})
        .moveDown();
}

const generateSaleVatTable = (doc, table, reports) => {
    let i, y;
    var sumAllTotal = 0, sumAllDiscount = 0, sumAllTotalExcludeVat = 0, sumAllVat = 0, sumAllSubtotal = 0;
    let rowValues = [];
    //move down 1
    doc.moveDown();
    // doc.font(bold);
    doc.font(regular);
    table
        //add plugin for fix column
        .addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
            column: 'created_date'
        }))
        .setColumnsDefaults({
            // 'B' => 'buttom' , 'T' => 'top' , R => 'right' , 'L' => 'left'
            headerBorder:['B'],color:'#aaaaaa',align: 'right', padding: [5, 0, 5, 0]
        })
        .addColumns(setColumns(doc))
        // add events (here, we draw headers on each new page)
        .onPageAdded(function (tb) {
            tb.addHeader();
        });
    //loop data in sale vat query
    for (i = 0; i < reports.length; i++) {
        const report = reports[i];
        let arrayRow = [];
        arrayRow[0] = report.created_date;
        arrayRow[1] = report.rd_code;
        arrayRow[2] = report.first_receipt;
        arrayRow[3] = report.last_receipt;
        arrayRow[4] = 'สินค้าและบริการอาหารและเครื่องดื่ม';
        arrayRow[5] = commaNumber(report.total_ex_vat);
        arrayRow[6] = commaNumber(formatCurrency(0));
        arrayRow[7] = commaNumber(report.total_ex_vat);
        arrayRow[8] = commaNumber(report.sum_vat);
        arrayRow[9] = commaNumber(report.sum_total)
        //add row to body
        rowValues[i] = setRows(doc, arrayRow);
        //sum total in query
        sumAllTotalExcludeVat += parseFloat(report.total_ex_vat);
        sumAllDiscount += parseFloat(0);
        sumAllVat += parseFloat(report.sum_vat);
        sumAllTotal += parseFloat(report.sum_total);
    }
    //set last row sum vat total
    const countRow = reports.length;
    let arrayLastRow = [];
    arrayLastRow[5] = formatCurrency(sumAllTotalExcludeVat),{align:'center'};
    arrayLastRow[6] = formatCurrency(sumAllDiscount);
    arrayLastRow[7] = formatCurrency(sumAllTotalExcludeVat);
    arrayLastRow[8] = formatCurrency(sumAllVat);
    arrayLastRow[9] = formatCurrency(sumAllTotal);
    rowValues[countRow] = setRows(doc, arrayLastRow);
    table.addBody(rowValues);
}

const setRows = (doc, value) => {
    return {
        created_date: value[0],
        rd_code: value[1],
        first_receipt: value[2],
        last_receipt: value[3],
        description: value[4],
        total_ex_vat: value[5],
        tax_free: value[6],
        tax_base: value[7],
        sum_vat: value[8],
        sum_total: value[9]
    };
}

const setColumns = (doc) => {
    return [
        {
            id: 'created_date',
            header: 'วัน-เดือน-ปี',
            width: 20,
            align: 'left',
            renderer: function (tb, data) {
                return data.created_date == undefined ? '':toBuddhistYear(moment(data.created_date).locale('th'), 'DD MMM YY');
            }
        },
        {
            id: 'rd_code',
            header: 'หมายเลขเครื่องที่ออกโดยกรมสรรพากร',
            width: 80,
            align: 'left'
        },
        {
            id: 'first_receipt',
            header: 'เลขที่บิลเริ่มต้น',
            width: 60,
            align: 'left'
        },
        {
            id: 'last_receipt',
            header: 'เลขที่บิลสิ้นสุด',
            width: 60,
            align: 'left'
        },
        {
            id: 'description',
            header: 'รายละเอียด',
            width: 80,
            align: 'left'
        },
        {
            id: 'total_ex_vat',
            header: 'มูลค่าทั้งหมด',
            width: 40
        },
        {
            id: 'tax_free',
            header: 'มูลค่ายกเว้นภาษี',
            width: 40
        },
        {
            id: 'tax_base',
            header: 'ฐานภาษี',
            width: 30
        },
        {
            id: 'sum_vat',
            header: 'ภาษี',
            width: 30
        },
        {
            id: 'sum_total',
            header: 'ยอดรวม',
            width: 30
        }];
}
const formatCurrency = (total) => {
    return commaNumber(total.toFixed(2));
}

const toBuddhistYear = (moment, format) => {
    var christianYear = moment.format('YYYY')
    var buddhishYear = (parseInt(christianYear) + 543).toString()
    return moment
        .format(format.replace('YYYY', buddhishYear).replace('YY', buddhishYear.substring(2, 4)))
        .replace(christianYear, buddhishYear)
}

const checkNameData = (name) => {
    if (name != null) {
        if (typeof name.th !== 'undefined') {
            name = name.th;
        } else if (typeof name.en !== 'undefined') {
            name = name.en;
        } else {
            name = '';
        }
    }

    return name;
}
