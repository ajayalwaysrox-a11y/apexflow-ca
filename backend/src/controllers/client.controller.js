const prisma = require("../config/database");

const getClients = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        clientCode: "asc",
      },
    });

    return res.json(clients);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

const createClient = async (req, res) => {
  try {
    const {
      clientName,
      businessName,
      pan,
      gstin,
      mobile,
      email,
      address
    } = req.body;

    const count = await prisma.client.count();

    const clientCode =
      `CLIENT-${String(count + 1).padStart(4, "0")}`;

    const client = await prisma.client.create({
      data: {
        clientCode,
        clientName,
        businessName,
        pan,
        gstin,
        mobile,
        email,
        address
      }
    });

    return res.status(201).json(client);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create client"
    });

  }
};

module.exports = {
  getClients,
  createClient
};