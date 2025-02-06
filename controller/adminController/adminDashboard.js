const bcrypt=require('bcrypt');
const Admin=require('../../models/dbadmin');


const loadLogin= async(req,res)=>{    
      return res.render('admin-login',{error:null});    
}

const login= async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.render("admin-login", { error: "Invalid email or password" });
    }

    // Set session
    req.session.admin = { email: admin.email };
    res.redirect("/admin/dashboard");    
}

const loadDashboard= (req,res)=>{
    if(!req.session.admin){
      return res.redirect('/admin/login');
    }
    const adminEmail=req.session.admin;
    res.render('dashboard',{products: []});
}

const logout= (req, res) => {
    req.session.destroy(() => {
        res.redirect("/admin/login");
    });
}


module.exports={
    loadLogin,
    login,
    loadDashboard,
    logout,  
}
