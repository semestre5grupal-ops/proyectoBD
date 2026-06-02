const Rubrosxrol = require('../models/rubrosxrolModel');

const getAllRubrosxrols = async (req, res) => {
  try {
    const data = await Rubrosxrol.getRubrosxrols();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRubrosxrol = async (req, res) => {
  try {
    const newData = await Rubrosxrol.createRubrosxrol(req.body);
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllRubrosxrols,
  createRubrosxrol
};
