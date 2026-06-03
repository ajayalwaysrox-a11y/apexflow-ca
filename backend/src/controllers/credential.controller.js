const prisma = require("../config/database");

const getCredentials = async (req, res) => {
  try {
    const { clientId } = req.params;

    const credentials =
      await prisma.clientCredential.findUnique({
        where: {
          clientId,
        },
      });

    await prisma.credentialAuditLog.create({
      data: {
        clientId,
        userId: req.user.id ,
        action: "VIEW",
        remarks: "Viewed credential record"
      }
    });

    return res.json(credentials);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch credentials",
    });

  }
};

const saveCredentials = async (req, res) => {
  try {

    const { clientId } = req.params;

    const {
      gstUsername,
      gstPassword,
      incomeTaxUsername,
      incomeTaxPassword
    } = req.body;

    const existing =
      await prisma.clientCredential.findUnique({
        where: {
          clientId,
        },
      });

    let result;

    if (existing) {

      result =
        await prisma.clientCredential.update({
          where: {
            clientId,
          },
          data: {
            gstUsername,
            gstPassword,
            incomeTaxUsername,
            incomeTaxPassword,
          },
        });

    } else {

      result =
        await prisma.clientCredential.create({
          data: {
            clientId,
            gstUsername,
            gstPassword,
            incomeTaxUsername,
            incomeTaxPassword,
          },
        });

    }

    await prisma.credentialAuditLog.create({
      data: {
        clientId,
        userId: req.user.id,
        action: "UPDATE",
        remarks: "Updated credential record"
      }
    });

    return res.json(result);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to save credentials",
    });

  }
};

module.exports = {
  getCredentials,
  saveCredentials,
};