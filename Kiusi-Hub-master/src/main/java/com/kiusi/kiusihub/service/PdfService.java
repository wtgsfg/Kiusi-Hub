package com.kiusi.kiusihub.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.BaseFont;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.kiusi.kiusihub.model.Factura;
import com.kiusi.kiusihub.model.ItemPedido;
import com.kiusi.kiusihub.model.Pedido;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

@Service
public class PdfService {

    private static final DecimalFormatSymbols symbols = new DecimalFormatSymbols(new Locale("es", "CO"));
    private static final DecimalFormat moneyFormat = new DecimalFormat("$#,##0.00", symbols);
    private static final DecimalFormat numberFormat = new DecimalFormat("#,##0.00", symbols);
    private static final SimpleDateFormat dateFormatter = new SimpleDateFormat("dd/MM/yyyy");
    
    private static BaseFont getFont() throws DocumentException {
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new DocumentException("Error al cargar la fuente", e);
        }
    }

    public byte[] generateFacturaPdf(Factura factura, List<ItemPedido> items) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.LETTER, 40, 40, 30, 30);
        PdfWriter.getInstance(document, outputStream);
        document.open();

        BaseFont bf = getFont();
        Font titleFont = new Font(bf, 24, Font.BOLD, BaseColor.BLACK);
        Font headerFont = new Font(bf, 12, Font.BOLD, BaseColor.BLACK);
        Font normalFont = new Font(bf, 10, Font.NORMAL, BaseColor.BLACK);
        Font smallFont = new Font(bf, 9, Font.NORMAL, BaseColor.BLACK);
        Font boldFont = new Font(bf, 10, Font.BOLD, BaseColor.BLACK);

        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{2, 1.5f, 2});

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        Paragraph logoText = new Paragraph("kiu\ns.i.co", titleFont);
        logoText.setAlignment(Element.ALIGN_LEFT);
        leftCell.addElement(logoText);
        headerTable.addCell(leftCell);

        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph remisionText = new Paragraph("REMISIÓN\nNo. FV-" + factura.getId(), headerFont);
        remisionText.setAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(remisionText);
        headerTable.addCell(centerCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph graciasText = new Paragraph("GRA-\nCIAS\nPOR TU COMPRA", headerFont);
        graciasText.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(graciasText);
        headerTable.addCell(rightCell);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1, 1});

        PdfPCell clienteCell = new PdfPCell();
        clienteCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        clienteCell.setPadding(8);
        clienteCell.addElement(new Paragraph("INFORMACIÓN DEL CLIENTE", headerFont));
        
        PdfPTable clienteDetails = new PdfPTable(2);
        clienteDetails.setWidthPercentage(100);
        clienteDetails.setWidths(new float[]{1, 3});
        clienteDetails.addCell(createCellSmall("NIT No.:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("DIRECCIÓN:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("TELEFONO:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("CIUDAD:", smallFont));
        clienteDetails.addCell(createCellSmall("PAIS : Colombia", smallFont));
        
        clienteCell.addElement(clienteDetails);
        infoTable.addCell(clienteCell);

        PdfPCell derechaCell = new PdfPCell();
        derechaCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        derechaCell.setPadding(8);
        
        PdfPTable derechaTable = new PdfPTable(2);
        derechaTable.setWidthPercentage(100);
        derechaTable.setWidths(new float[]{1, 1});
        derechaTable.addCell(createCell("FECHA", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell(dateFormatter.format(factura.getFecha()), normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("TOTAL", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell(moneyFormat.format(factura.getTotal()), normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("VENDEDOR", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("FECHA VENCIMIENTO", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("REFERENCIA", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        
        derechaCell.addElement(derechaTable);
        infoTable.addCell(derechaCell);

        document.add(infoTable);
        document.add(new Paragraph(" "));

        PdfPTable itemsTable = new PdfPTable(6);
        itemsTable.setWidthPercentage(100);
        itemsTable.setWidths(new float[]{1.2f, 3f, 0.8f, 1.2f, 0.8f, 1.2f});
        
        itemsTable.addCell(createHeaderCell("CODIGO", smallFont));
        itemsTable.addCell(createHeaderCell("DESCRIPCIÓN", smallFont));
        itemsTable.addCell(createHeaderCell("CANTIDAD", smallFont));
        itemsTable.addCell(createHeaderCell("VALOR UNIT.", smallFont));
        itemsTable.addCell(createHeaderCell("DCTO.", smallFont));
        itemsTable.addCell(createHeaderCell("VALOR TOTAL", smallFont));

        double totalBruto = 0;
        for (ItemPedido item : items) {
            itemsTable.addCell(createCell("", normalFont));
            itemsTable.addCell(createCell(item.getNombreProducto() != null ? item.getNombreProducto() : "", normalFont));
            itemsTable.addCell(createCell(String.valueOf(item.getCantidad()), normalFont));
            itemsTable.addCell(createCell(numberFormat.format(item.getPrecio()), normalFont));
            itemsTable.addCell(createCell("0", normalFont));
            itemsTable.addCell(createCell(numberFormat.format(item.getSubtotal()), normalFont));
            totalBruto += item.getSubtotal();
        }

        document.add(itemsTable);
        document.add(new Paragraph(" "));

        PdfPTable pagoTable = new PdfPTable(3);
        pagoTable.setWidthPercentage(100);
        pagoTable.setWidths(new float[]{1.5f, 1.5f, 1});
        pagoTable.addCell(createHeaderCell("FORMA DE PAGO", smallFont));
        pagoTable.addCell(createHeaderCell("IDENTIFICACIÓN", smallFont));
        pagoTable.addCell(createHeaderCell("VALOR", smallFont));
        pagoTable.addCell(createCell("", normalFont));
        pagoTable.addCell(createCell("", normalFont));
        pagoTable.addCell(createCell(numberFormat.format(totalBruto), normalFont));

        document.add(pagoTable);
        document.add(new Paragraph(" "));

        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setWidthPercentage(100);
        totalTable.setWidths(new float[]{3, 1});
        totalTable.addCell(createCell("VALOR (en letras):", boldFont, BaseColor.LIGHT_GRAY));
        totalTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        totalTable.addCell(createCell("", normalFont));
        
        PdfPTable totalesDerecha = new PdfPTable(2);
        totalesDerecha.setWidthPercentage(100);
        totalesDerecha.addCell(createCellRight("TOTAL BRUTO:", boldFont));
        totalesDerecha.addCell(createCellRight(moneyFormat.format(totalBruto), normalFont));
        totalesDerecha.addCell(createCellRight("- Descuentos:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        totalesDerecha.addCell(createCellRight("SUBTOTAL:", normalFont));
        totalesDerecha.addCell(createCellRight(moneyFormat.format(totalBruto), normalFont));
        totalesDerecha.addCell(createCellRight("+ Impuestos:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        totalesDerecha.addCell(createCellRight("- Retenciones:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        
        PdfPCell totalFinalCell = new PdfPCell(new Phrase("TOTAL NETO:", new Font(bf, 12, Font.BOLD, BaseColor.BLUE)));
        totalFinalCell.setBorder(Rectangle.NO_BORDER);
        totalFinalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalesDerecha.addCell(totalFinalCell);
        
        PdfPCell totalValorCell = new PdfPCell(new Phrase(moneyFormat.format(totalBruto), new Font(bf, 12, Font.BOLD, BaseColor.BLUE)));
        totalValorCell.setBorder(Rectangle.NO_BORDER);
        totalValorCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalesDerecha.addCell(totalValorCell);
        
        totalTable.addCell(totalesDerecha);

        document.add(totalTable);
        document.add(new Paragraph(" "));

        PdfPTable obsTable = new PdfPTable(3);
        obsTable.setWidthPercentage(100);
        obsTable.setWidths(new float[]{1.5f, 1.5f, 1});
        
        PdfPCell garantiaCell = new PdfPCell();
        garantiaCell.setPadding(5);
        garantiaCell.addElement(new Paragraph("Garantía", smallFont));
        garantiaCell.addElement(new Paragraph("Garantía", normalFont));
        obsTable.addCell(garantiaCell);
        
        PdfPCell retencionesCell = new PdfPCell();
        retencionesCell.setPadding(5);
        retencionesCell.addElement(new Paragraph("Retenciones:", smallFont));
        retencionesCell.addElement(new Paragraph("Seleccionar...", normalFont));
        retencionesCell.addElement(new Paragraph("+ Agregar retención", smallFont));
        obsTable.addCell(retencionesCell);
        
        PdfPCell obsCell = new PdfPCell();
        obsCell.setPadding(5);
        obsCell.addElement(new Paragraph("Observación", smallFont));
        obsTable.addCell(obsCell);

        document.add(obsTable);
        document.add(new Paragraph(" "));

        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        footerTable.setWidths(new float[]{2, 1});
        
        PdfPCell entregaCell = new PdfPCell();
        entregaCell.setPadding(5);
        entregaCell.addElement(new Paragraph("1 CAJA", smallFont));
        entregaCell.addElement(new Paragraph("ENTREGA : TRANSCARGA", smallFont));
        entregaCell.addElement(new Paragraph("CANTO CLARO", smallFont));
        footerTable.addCell(entregaCell);
        
        PdfPTable firmasTable = new PdfPTable(2);
        firmasTable.setWidthPercentage(100);
        PdfPCell aprobadocell = new PdfPCell(new Phrase("Aprobado", normalFont));
        aprobadocell.setPadding(10);
        aprobadocell.setHorizontalAlignment(Element.ALIGN_CENTER);
        aprobadocell.setBorder(Rectangle.BOX);
        firmasTable.addCell(aprobadocell);
        
        PdfPCell recibicell = new PdfPCell();
        recibicell.setPadding(10);
        Paragraph recibiText = new Paragraph("RECIBÍ", normalFont);
        recibiText.setAlignment(Element.ALIGN_CENTER);
        recibicell.addElement(recibiText);
        Paragraph ccText = new Paragraph("C.C. O NIT.", smallFont);
        ccText.setAlignment(Element.ALIGN_CENTER);
        recibicell.addElement(ccText);
        recibicell.setBorder(Rectangle.BOX);
        firmasTable.addCell(recibicell);
        
        footerTable.addCell(firmasTable);

        document.add(footerTable);
        document.add(new Paragraph(" "));
        
        Paragraph footerText = new Paragraph("FRM-010V\n(NIIF) Impreso con ContaPyme V. 4 - InSoft SAS, Nit 810.000.630-9.contapyme.com", new Font(bf, 8, Font.NORMAL, BaseColor.GRAY));
        footerText.setAlignment(Element.ALIGN_LEFT);
        document.add(footerText);

        document.close();
        return outputStream.toByteArray();
    }

    public byte[] generateOrdenVentaPdf(Pedido pedido, List<ItemPedido> items) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.LETTER, 40, 40, 30, 30);
        PdfWriter.getInstance(document, outputStream);
        document.open();

        BaseFont bf = getFont();
        Font titleFont = new Font(bf, 24, Font.BOLD, BaseColor.BLACK);
        Font headerFont = new Font(bf, 12, Font.BOLD, BaseColor.BLACK);
        Font normalFont = new Font(bf, 10, Font.NORMAL, BaseColor.BLACK);
        Font smallFont = new Font(bf, 9, Font.NORMAL, BaseColor.BLACK);
        Font boldFont = new Font(bf, 10, Font.BOLD, BaseColor.BLACK);

        PdfPTable headerTable = new PdfPTable(3);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{2, 1.5f, 2});

        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        Paragraph logoText = new Paragraph("kiu\ns.i.co", titleFont);
        logoText.setAlignment(Element.ALIGN_LEFT);
        leftCell.addElement(logoText);
        headerTable.addCell(leftCell);

        PdfPCell centerCell = new PdfPCell();
        centerCell.setBorder(Rectangle.NO_BORDER);
        centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        Paragraph remisionText = new Paragraph("ORDEN DE VENTA\nNo. OV-" + pedido.getId(), headerFont);
        remisionText.setAlignment(Element.ALIGN_CENTER);
        centerCell.addElement(remisionText);
        headerTable.addCell(centerCell);

        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph graciasText = new Paragraph("GRA-\nCIAS\nPOR TU COMPRA", headerFont);
        graciasText.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(graciasText);
        headerTable.addCell(rightCell);

        document.add(headerTable);
        document.add(new Paragraph(" "));

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1, 1});

        PdfPCell clienteCell = new PdfPCell();
        clienteCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        clienteCell.setPadding(8);
        clienteCell.addElement(new Paragraph("INFORMACIÓN DEL CLIENTE", headerFont));
        
        PdfPTable clienteDetails = new PdfPTable(2);
        clienteDetails.setWidthPercentage(100);
        clienteDetails.setWidths(new float[]{1, 3});
        clienteDetails.addCell(createCellSmall("NIT No.:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("DIRECCIÓN:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("TELEFONO:", smallFont));
        clienteDetails.addCell(createCellSmall("", smallFont));
        clienteDetails.addCell(createCellSmall("CIUDAD:", smallFont));
        clienteDetails.addCell(createCellSmall("PAIS : Colombia", smallFont));
        
        clienteCell.addElement(clienteDetails);
        clienteCell.addElement(new Paragraph(" "));
        clienteCell.addElement(new Paragraph("CLIENTE: " + (pedido.getCliente() != null ? pedido.getCliente() : "Cliente no especificado"), normalFont));
        infoTable.addCell(clienteCell);

        PdfPCell derechaCell = new PdfPCell();
        derechaCell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        derechaCell.setPadding(8);
        
        PdfPTable derechaTable = new PdfPTable(2);
        derechaTable.setWidthPercentage(100);
        derechaTable.setWidths(new float[]{1, 1});
        derechaTable.addCell(createCell("FECHA", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell(dateFormatter.format(pedido.getFecha()), normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("TOTAL", headerFont, BaseColor.LIGHT_GRAY));
        
        double total = 0;
        for (ItemPedido item : items) {
            total += item.getSubtotal();
        }
        derechaTable.addCell(createCell(moneyFormat.format(total), normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("VENDEDOR", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("FECHA VENCIMIENTO", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("REFERENCIA", headerFont, BaseColor.LIGHT_GRAY));
        derechaTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        
        derechaCell.addElement(derechaTable);
        infoTable.addCell(derechaCell);

        document.add(infoTable);
        document.add(new Paragraph(" "));

        PdfPTable detalleTable = new PdfPTable(6);
        detalleTable.setWidthPercentage(100);
        detalleTable.setWidths(new float[]{1.2f, 3f, 0.8f, 1.2f, 0.8f, 1.2f});
        
        detalleTable.addCell(createHeaderCell("CODIGO", smallFont));
        detalleTable.addCell(createHeaderCell("DESCRIPCIÓN", smallFont));
        detalleTable.addCell(createHeaderCell("CANTIDAD", smallFont));
        detalleTable.addCell(createHeaderCell("VALOR UNIT.", smallFont));
        detalleTable.addCell(createHeaderCell("DCTO.", smallFont));
        detalleTable.addCell(createHeaderCell("VALOR TOTAL", smallFont));

        for (ItemPedido item : items) {
            detalleTable.addCell(createCell("", normalFont));
            detalleTable.addCell(createCell(item.getNombreProducto() != null ? item.getNombreProducto() : "", normalFont));
            detalleTable.addCell(createCell(String.valueOf(item.getCantidad()), normalFont));
            detalleTable.addCell(createCell(numberFormat.format(item.getPrecio()), normalFont));
            detalleTable.addCell(createCell("0", normalFont));
            detalleTable.addCell(createCell(numberFormat.format(item.getSubtotal()), normalFont));
        }

        document.add(detalleTable);
        document.add(new Paragraph(" "));

        PdfPTable pagoTable = new PdfPTable(3);
        pagoTable.setWidthPercentage(100);
        pagoTable.setWidths(new float[]{1.5f, 1.5f, 1});
        pagoTable.addCell(createHeaderCell("FORMA DE PAGO", smallFont));
        pagoTable.addCell(createHeaderCell("IDENTIFICACIÓN", smallFont));
        pagoTable.addCell(createHeaderCell("VALOR", smallFont));
        pagoTable.addCell(createCell("", normalFont));
        pagoTable.addCell(createCell("", normalFont));
        pagoTable.addCell(createCell(numberFormat.format(total), normalFont));

        document.add(pagoTable);
        document.add(new Paragraph(" "));

        PdfPTable totalTable = new PdfPTable(2);
        totalTable.setWidthPercentage(100);
        totalTable.setWidths(new float[]{3, 1});
        totalTable.addCell(createCell("VALOR (en letras):", boldFont, BaseColor.LIGHT_GRAY));
        totalTable.addCell(createCell("", normalFont, BaseColor.LIGHT_GRAY));
        totalTable.addCell(createCell("", normalFont));
        
        PdfPTable totalesDerecha = new PdfPTable(2);
        totalesDerecha.setWidthPercentage(100);
        totalesDerecha.addCell(createCellRight("TOTAL BRUTO:", boldFont));
        totalesDerecha.addCell(createCellRight(moneyFormat.format(total), normalFont));
        totalesDerecha.addCell(createCellRight("- Descuentos:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        totalesDerecha.addCell(createCellRight("SUBTOTAL:", normalFont));
        totalesDerecha.addCell(createCellRight(moneyFormat.format(total), normalFont));
        totalesDerecha.addCell(createCellRight("+ Impuestos:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        totalesDerecha.addCell(createCellRight("- Retenciones:", normalFont));
        totalesDerecha.addCell(createCellRight("$0.00", normalFont));
        
        PdfPCell totalFinalCell = new PdfPCell(new Phrase("TOTAL NETO:", new Font(bf, 12, Font.BOLD, BaseColor.BLUE)));
        totalFinalCell.setBorder(Rectangle.NO_BORDER);
        totalFinalCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalesDerecha.addCell(totalFinalCell);
        
        PdfPCell totalValorCell = new PdfPCell(new Phrase(moneyFormat.format(total), new Font(bf, 12, Font.BOLD, BaseColor.BLUE)));
        totalValorCell.setBorder(Rectangle.NO_BORDER);
        totalValorCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalesDerecha.addCell(totalValorCell);
        
        totalTable.addCell(totalesDerecha);

        document.add(totalTable);
        document.add(new Paragraph(" "));

        PdfPTable obsTable = new PdfPTable(3);
        obsTable.setWidthPercentage(100);
        obsTable.setWidths(new float[]{1.5f, 1.5f, 1});
        
        PdfPCell garantiaCell = new PdfPCell();
        garantiaCell.setPadding(5);
        garantiaCell.addElement(new Paragraph("Garantía", smallFont));
        garantiaCell.addElement(new Paragraph("Garantía", normalFont));
        obsTable.addCell(garantiaCell);
        
        PdfPCell retencionesCell = new PdfPCell();
        retencionesCell.setPadding(5);
        retencionesCell.addElement(new Paragraph("Retenciones:", smallFont));
        retencionesCell.addElement(new Paragraph("Seleccionar...", normalFont));
        retencionesCell.addElement(new Paragraph("+ Agregar retención", smallFont));
        obsTable.addCell(retencionesCell);
        
        PdfPCell obsCell = new PdfPCell();
        obsCell.setPadding(5);
        obsCell.addElement(new Paragraph("Observación", smallFont));
        if (pedido.getObservaciones() != null && !pedido.getObservaciones().isEmpty()) {
            obsCell.addElement(new Paragraph(pedido.getObservaciones(), normalFont));
        }
        obsTable.addCell(obsCell);

        document.add(obsTable);
        document.add(new Paragraph(" "));

        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        footerTable.setWidths(new float[]{2, 1});
        
        PdfPCell entregaCell = new PdfPCell();
        entregaCell.setPadding(5);
        entregaCell.addElement(new Paragraph("1 CAJA", smallFont));
        entregaCell.addElement(new Paragraph("ENTREGA : TRANSCARGA", smallFont));
        entregaCell.addElement(new Paragraph("CANTO CLARO", smallFont));
        footerTable.addCell(entregaCell);
        
        PdfPTable firmasTable = new PdfPTable(2);
        firmasTable.setWidthPercentage(100);
        PdfPCell aprobadocell = new PdfPCell(new Phrase("Aprobado", normalFont));
        aprobadocell.setPadding(10);
        aprobadocell.setHorizontalAlignment(Element.ALIGN_CENTER);
        aprobadocell.setBorder(Rectangle.BOX);
        firmasTable.addCell(aprobadocell);
        
        PdfPCell recibicell = new PdfPCell();
        recibicell.setPadding(10);
        Paragraph recibiText = new Paragraph("RECIBÍ", normalFont);
        recibiText.setAlignment(Element.ALIGN_CENTER);
        recibicell.addElement(recibiText);
        Paragraph ccText = new Paragraph("C.C. O NIT.", smallFont);
        ccText.setAlignment(Element.ALIGN_CENTER);
        recibicell.addElement(ccText);
        recibicell.setBorder(Rectangle.BOX);
        firmasTable.addCell(recibicell);
        
        footerTable.addCell(firmasTable);

        document.add(footerTable);
        document.add(new Paragraph(" "));
        
        Paragraph footerText = new Paragraph("FRM-010V\n(NIIF) Impreso con ContaPyme V. 4 - InSoft SAS, Nit 810.000.630-9.contapyme.com", new Font(bf, 8, Font.NORMAL, BaseColor.GRAY));
        footerText.setAlignment(Element.ALIGN_LEFT);
        document.add(footerText);

        document.close();
        return outputStream.toByteArray();
    }

    private PdfPCell createHeaderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell createCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        return cell;
    }

    private PdfPCell createCell(String text, Font font, BaseColor backgroundColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setBackgroundColor(backgroundColor);
        return cell;
    }

    private PdfPCell createCellSmall(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(3);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private PdfPCell createCellRight(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }
}
