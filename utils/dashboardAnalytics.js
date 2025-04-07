const Order= require('../models/orderModal');
const Product= require('../models/productModel');
const mongoose = require('mongoose');

const getDashboardData =async (timeFilter = 'monthly') => {
    try {
        // Calculate date range based on filter
        const dateRange = getDateRangeFromFilter(timeFilter);
        // console.log(dateRange)
        // Basic statistics
        const totalSales = await calculateTotalSales(dateRange.startDate, dateRange.endDate);
        const orderCount = await calculateOrderCount(dateRange.startDate, dateRange.endDate);
        const productCount = await calculateProductCount();
        const averageOrderValue = totalSales / (orderCount || 1);
        
        // Sales chart data
        const salesChartData = await generateSalesChartData(timeFilter);
        
        // Top selling data
        const topProducts = await getTopSellingProducts(dateRange.startDate, dateRange.endDate);
        const topCategories = await getTopSellingCategories(dateRange.startDate, dateRange.endDate);
        const topBrands = await getTopSellingBrands(dateRange.startDate, dateRange.endDate);
        
        return {
            stats: {
                totalSales,
                orderCount,
                productCount,
                averageOrderValue
            },
            salesChartData,
            topProducts,
            topCategories,
            topBrands
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
};

function getDateRangeFromFilter(timeFilter) {
    const now = new Date();
    let startDate, endDate = now;
    
    switch (timeFilter) {
        case 'daily':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate.setHours(23, 59, 59, 999); // End of today
            break;
        case 'weekly':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'monthly':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'yearly':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
    }

    
    return { startDate, endDate: now};
}

async function calculateTotalSales(startDate,endDate){
    const result= await Order.aggregate([{
        $match: {createdAt:{$gte:startDate,$lte:endDate},
                orderStatus:{$nin:["Cancelled","Returned"]}}
    },{
        $group:{_id:null,
            totalSales:{$sum:"$totalAmount"}}
    }]);
    return result.length>0 ? result[0].totalSales : 0;
}

async function calculateOrderCount(startDate,endDate){
    return await Order.countDocuments(
        {createdAt:{$gte:startDate,$lte:endDate},
        orderStatus:{$nin:["Cancelled","Returned"]}
    });   
    // return result;     
}

async function calculateProductCount(){
    return await Product.countDocuments({isDeleted:false});
}

async function generateSalesChartData(timeFilter) {
    let groupBy;
    let format;
    let dateRange = getDateRangeFromFilter(timeFilter);
    
    // Set group by format based on filter
    switch (timeFilter) {
        case 'daily':
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            format = 'Hour';
            break;
        case 'weekly':
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            format = 'Day';
            break;
        case 'monthly':
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            format = 'Day';
            break;
        case 'yearly':
            groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
            format = 'Month';
            break;
        default:
            groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
            format = 'Day';
    }
    
    const salesData = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
                orderStatus: { $nin: ['Cancelled', 'Returned'] }
            }
        },
        {
            $group: {
                _id: groupBy,
                sales: { $sum: '$totalAmount' },
                orders: { $sum: 1 },
                items: { $sum: { $size: '$items' } }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    // Format data for charts
    return {
        labels: salesData.map(item => item._id),
        datasets: [
            {
                label: 'Sales',
                data: salesData.map(item => item.sales||0),
                backgroundColor: 'rgba(44, 120, 220, 0.2)',
                borderColor: 'rgba(44, 120, 220)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Orders',
                data: salesData.map(item => item.orders||0),
                backgroundColor: 'rgba(4, 209, 130, 0.2)',
                borderColor: 'rgb(4, 209, 130)',
                fill: true,
                tension: 0.3
            },
            {
                label: 'Items',
                data: salesData.map(item => item.items||0),
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgb(255, 159, 64)',
                fill: true,
                tension: 0.3
            }
        ],
        format
    };
}

async function getTopSellingProducts(startDate,endDate){
    const topProducts= await Order.aggregate([
        {
            $match: {createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled', 'Returned'] }}
        },
        {$unwind:"$items"},
        {
            $group: {
                _id: '$items.product',
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.finalPrice', '$items.quantity'] } }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $project: {
                name: '$productDetails.name',
                totalQuantity: 1,
                totalRevenue: 1
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ])

    return {
        labels: topProducts.map(product => product.name),
        quantities: topProducts.map(product => product.totalQuantity),
        revenues: topProducts.map(product => product.totalRevenue)
    };
}

/**
 * Get top 10 selling categories
 */
async function getTopSellingCategories(startDate, endDate) {
    const topCategories = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: ['Cancelled', 'Returned'] }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'categories',
                localField: 'product.category',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $group: {
                _id: '$category._id',
                categoryName: { $first: '$category.name' },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.finalPrice', '$items.quantity'] } }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);
    
    return {
        labels: topCategories.map(category => category.categoryName),
        quantities: topCategories.map(category => category.totalQuantity),
        revenues: topCategories.map(category => category.totalRevenue)
    };
}




async function getTopSellingBrands(startDate, endDate) {
    const topBrands = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                orderStatus: { $nin: ['Cancelled', 'Returned'] }
            }
        },
        { $unwind: '$items' },
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'brands',
                localField: 'product.brands',
                foreignField: '_id',
                as: 'brand'
            }
        },
        { $unwind: '$brand' },
        {
            $group: {
                _id: '$brand._id',
                brandName: { $first: '$brand.name' },
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.finalPrice', '$items.quantity'] } }
            }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
    ]);
    
    return {
        labels: topBrands.map(brand => brand.brandName),
        quantities: topBrands.map(brand => brand.totalQuantity),
        revenues: topBrands.map(brand => brand.totalRevenue)
    };
}


module.exports={
    getDashboardData
}